<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_REST_API
{
  public function __construct()
  {
    add_action('rest_api_init', [$this, 'register_routes']);
  }

  public function register_routes()
  {
    $ns = 'formflow/v1';

    // GET all forms
    register_rest_route($ns, '/forms', [
      'methods'             => 'GET',
      'callback'            => [$this, 'get_forms'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // GET single form (builder loads this)
    register_rest_route($ns, '/forms/(?P<id>\d+)', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST create form
    register_rest_route($ns, '/forms', [
      'methods'  => 'POST',
      'callback' => [$this, 'create_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // PATCH update form (builder auto-saves to draft slot)
    register_rest_route($ns, '/forms/(?P<id>\d+)', [
      'methods'  => 'PATCH',
      'callback' => [$this, 'update_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // PATCH update form design — writes directly to published slot (and draft if exists)
    register_rest_route($ns, '/forms/(?P<id>\d+)/design', [
      'methods'             => 'PATCH',
      'callback'            => [$this, 'update_design'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // PATCH update form settings — writes directly to top-level settings key
    register_rest_route($ns, '/forms/(?P<id>\d+)/settings', [
      'methods'             => 'PATCH',
      'callback'            => [$this, 'update_settings'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST publish form (promote draft → published, clear draft)
    register_rest_route($ns, '/forms/(?P<id>\d+)/publish', [
      'methods'             => 'POST',
      'callback'            => [$this, 'publish_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST revert form (discard draft, restore published into builder)
    register_rest_route($ns, '/forms/(?P<id>\d+)/revert', [
      'methods'             => 'POST',
      'callback'            => [$this, 'revert_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // GET single form — public (renderer fetches this, no auth needed)
    register_rest_route($ns, '/forms/(?P<id>\d+)/public', [
      'methods'             => 'GET',
      'callback'            => [$this, 'get_form_public'],
      'permission_callback' => '__return_true',
    ]);

    // GET single form — preview (builder iframe, auth required, draft-first)
    register_rest_route($ns, '/forms/(?P<id>\d+)/preview', [
      'methods'             => 'GET',
      'callback'            => [$this, 'get_form_preview'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST submit (public — no authentication required)
    register_rest_route($ns, '/forms/(?P<id>\d+)/submit', [
      'methods'             => 'POST',
      'callback'            => [$this, 'handle_submission'],
      'permission_callback' => '__return_true',
      'args'                => [
        'id' => [
          'validate_callback' => fn($v) => is_numeric($v) && $v > 0,
          'sanitize_callback' => 'absint',
        ],
      ],
    ]);

    // POST /forms/from-template
    register_rest_route($ns, '/forms/from-template', [
      'methods'             => 'POST',
      'callback'            => [$this, 'create_form_from_template'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // GET /templates/{slug}/preview-url — returns a signed URL to preview a template.
    register_rest_route($ns, '/templates/(?P<slug>[a-z0-9_-]+)/preview-url', [
      'methods'             => 'GET',
      'callback'            => [$this, 'get_template_preview_url'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);
  }

  /**
   * Decode raw post_content into the new top-level structure:
   *
   *   {
   *     "content": { "published": {...}|null, "draft": {...}|null },
   *     "design":  {...}
   *   }
   *
   * Migration rules:
   *   - New format:    has top-level "content" key that is an array
   *                    → read directly.
   *   - Old format v1: has top-level "published" key (old slot wrapper)
   *                    → migrate: hoist design out of slots, restructure.
   *   - Legacy format: entire decoded value is form content (no wrapper)
   *                    → treat as published content, no draft, no design.
   *
   * @param  string $raw  Raw post_content string.
   * @return array{ content: array{ published: array|null, draft: array|null }, design: array }
   */
  private function decode_slots(string $raw): array
  {
    $empty = [
      'content' => ['published' => null, 'draft' => null],
      'design'  => [],
    ];

    if (empty($raw)) {
      return $empty;
    }

    $decoded = wpff_decode($raw);

    if (! is_array($decoded)) {
      return $empty;
    }

    // ── New format: top-level "content" key ──────────────────────────────
    if (array_key_exists('content', $decoded) && is_array($decoded['content'])) {
      return [
        'content' => [
          'published' => $decoded['content']['published'] ?? null,
          'draft'     => $decoded['content']['draft']     ?? null,
        ],
        'design'   => $decoded['design']   ?? [],
        'settings' => $decoded['settings'] ?? [],
      ];
    }

    // ── Old format v1: top-level "published" slot wrapper ────────────────
    // { "published": { "content": {...}, "design": {...} }, "draft": {...}|null }
    if (array_key_exists('published', $decoded)) {
      $pub   = $decoded['published'] ?? null;
      $draft = $decoded['draft']     ?? null;

      // Extract design from published slot (authoritative copy).
      $design = [];
      if (is_array($pub) && isset($pub['design'])) {
        $design = $pub['design'];
        unset($pub['design']);
      }

      // Strip design from draft slot too (we no longer store it there).
      if (is_array($draft) && isset($draft['design'])) {
        unset($draft['design']);
      }

      return [
        'content'  => ['published' => $pub, 'draft' => $draft],
        'design'   => $design,
        'settings' => [],
      ];
    }

    // ── Legacy format: raw content array ─────────────────────────────────
    // Strip design if it was embedded in the content array.
    $design = [];
    if (isset($decoded['design'])) {
      $design = $decoded['design'];
      unset($decoded['design']);
    }

    return [
      'content'  => ['published' => $decoded, 'draft' => null],
      'design'   => $design,
      'settings' => [],
    ];
  }

  /**
   * Encode the new top-level structure back to a JSON string for post_content.
   *
   * @param  array|null $published  Published content slot.
   * @param  array|null $draft      Draft content slot (null = no draft).
   * @param  array      $design     Design object (top-level, always live).
   * @param  array      $settings   Settings object (top-level, always live).
   * @return string
   */
  private function encode_slots(?array $published, ?array $draft, array $design = [], array $settings = []): string
  {
    return wp_json_encode(
      [
        'content'  => ['published' => $published, 'draft' => $draft],
        'design'   => $design,
        'settings' => $settings,
      ],
      JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
  }

  /**
   * Encode a single form-data array to JSON, preserving emoji.
   *
   * @param  array $data
   * @return string
   */
  private function encode_form_data(array $data): string
  {
    return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }

  /**
   * Separate design from form content.
   *
   * Templates (and any incoming form_data) may embed a "design" key inside the
   * content array. With the new top-level structure, design must be stored
   * separately. This helper pulls it out and returns both parts cleanly.
   *
   * @param  array $data  Raw content array, possibly containing a "design" key.
   * @return array{ content: array, design: array }
   */
  private function extract_design(array $data): array
  {
    $design = [];

    if (isset($data['design']) && is_array($data['design'])) {
      $design = $data['design'];
      unset($data['design']);
    }

    return ['content' => $data, 'design' => $design];
  }

    /**
   * Load the default form design from the PHP defaults file.
   *
   * Used for blank forms. Template forms use their own bundled design instead.
   * If the incoming form_data already contains a design (e.g. custom form_data
   * passed via the API), that takes precedence and this is not called.
   *
   * @return array
   */
  private function default_design(): array
  {
    $file = WP_FLOWFORMS_PATH . 'includes/defaults/form-design.php';
 
    if (! file_exists($file)) {
      return [];
    }
 
    $design = require $file;
 
    /**
     * Filter the default design applied to every new blank form.
     *
     * @since 1.0.0
     *
     * @param array $design Default design array.
     */
    return (array) apply_filters('wpff_default_form_design', $design);
  }

  /**
   * Load the default form settings from the PHP defaults file.
   *
   * This is the single source of truth for initial settings on every new form,
   * whether created blank or from a template.
   *
   * @return array
   */
  private function default_settings(): array
  {
    $file = WP_FLOWFORMS_PATH . 'includes/defaults/form-settings.php';

    if (! file_exists($file)) {
      return [];
    }

    $settings = require $file;

    /**
     * Filter the default settings applied to every new form.
     *
     * @since 1.0.0
     *
     * @param array $settings Default settings array.
     */
    return (array) apply_filters('wpff_default_form_settings', $settings);
  }

  /**
   * Write post_content directly via $wpdb to bypass wp_insert_post /
   * wp_update_post's internal wp_slash() call.
   *
   * @param  int    $post_id
   * @param  string $json
   * @return bool
   */
  private function save_post_content(int $post_id, string $json): bool
  {
    global $wpdb;

    $result = $wpdb->update(
      $wpdb->posts,
      ['post_content' => $json],
      ['ID'           => $post_id],
      ['%s'],
      ['%d']
    );

    if ($result !== false) {
      clean_post_cache($post_id);
    }

    return $result !== false;
  }

  public function get_forms($request)
  {
    $posts = get_posts([
      'post_type'      => 'wpff_forms',
      'post_status'    => 'publish',
      'posts_per_page' => -1,
      'orderby'        => 'title',
      'order'          => 'ASC',
    ]);

    $forms = array_map(fn($p) => [
      'id'    => $p->ID,
      'title' => $p->post_title,
    ], $posts);

    return rest_ensure_response([]);
  }

  public function get_form($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots     = $this->decode_slots($post->post_content);
    $has_draft = ! is_null($slots['content']['draft']);

    // Builder always loads the draft when one exists, otherwise published.
    $content = $has_draft ? $slots['content']['draft'] : $slots['content']['published'];

    $form = [
      'id'            => $post->ID,
      'title'         => $post->post_title,
      'status'        => $post->post_status,
      'content'       => $content,
      'design'        => $slots['design'],
      'settings'      => $slots['settings'],
      'has_draft'     => $has_draft,
      'has_published' => ! is_null($slots['content']['published']),
      'date_created'  => $post->post_date,
      'date_updated'  => $post->post_modified,
      'public_url'    => FlowForms_Frontend::get_public_url($post->ID),
      'preview_url'   => FlowForms_Frontend::get_preview_url($post->ID),
    ];

    return rest_ensure_response($form);
  }

  public function create_form($request)
  {
    $form_name = sanitize_text_field($request->get_param('form_name'));
    $form_data = $request->get_param('form_data');

    if (empty($form_name)) {
      $form_name = __('Untitled form', 'wp-flowforms');
    }

    if (is_string($form_data)) {
      $decoded = json_decode($form_data, true);
      if (json_last_error() === JSON_ERROR_NONE) {
        $form_data = $decoded;
      }
    }

    if (empty($form_data)) {
      $form_data = require WP_FLOWFORMS_PATH . 'includes/defaults/form-data.php';
    }

    $post_id = wp_insert_post([
      'post_title'   => $form_name,
      'post_content' => '',
      'post_status'  => 'publish',
      'post_type'    => 'wpff_forms',
    ]);

    if (is_wp_error($post_id)) {
      return new WP_REST_Response(['message' => 'Failed to create form.'], 500);
    }

    // New forms: store content in the draft slot only so the user must
    // explicitly hit Publish before the form goes live.
    // Hoist any embedded "design" key out of the content array to the top level.
    $extracted   = $this->extract_design($form_data);
    // Fall back to default design when the incoming data carries no design
    // (blank form). Template-created forms always have their own design.
    $form_design = ! empty($extracted['design']) ? $extracted['design'] : $this->default_design();
    $json        = $this->encode_slots(null, $extracted['content'], $form_design, $this->default_settings());
    $saved       = $this->save_post_content($post_id, $json);
 
    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to save form content.'], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'post_id'   => $post_id,
      'form_name' => $form_name,
      'message'   => 'Form created successfully.',
    ], 201);
  }

  public function update_form($request)
  {
    $form_id   = absint($request['id']);
    $form_name = $request->get_param('form_name');
    $form_data = $request->get_param('form_data');

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $has_update = false;

    if (! is_null($form_name)) {
      $result = wp_update_post([
        'ID'         => $form_id,
        'post_title' => sanitize_text_field($form_name),
      ], true);

      if (is_wp_error($result)) {
        return new WP_REST_Response(['message' => 'Failed to update form name.'], 500);
      }

      $has_update = true;
    }

    if (! is_null($form_data)) {
      if (is_string($form_data)) {
        $decoded = json_decode($form_data, true);
        if (json_last_error() === JSON_ERROR_NONE) {
          $form_data = $decoded;
        }
      }

      if (! empty($form_data)) {
        // Always write to the DRAFT slot; never touch published during auto-save.
        $slots = $this->decode_slots($post->post_content);
        $json  = $this->encode_slots($slots['content']['published'], $form_data, $slots['design'], $slots['settings']);
        $saved = $this->save_post_content($form_id, $json);

        if (! $saved) {
          return new WP_REST_Response(['message' => 'Failed to save form content.'], 500);
        }

        $has_update = true;
      }
    }

    if (! $has_update) {
      return new WP_Error('no_update_data', __('No data provided to update.', 'wp-flowforms'), ['status' => 400]);
    }

    return new WP_REST_Response([
      'success'  => true,
      'form_id'  => $form_id,
      'message'  => 'Form updated successfully.',
    ], 200);
  }

  /**
   * PATCH /forms/{id}/design
   *
   * Writes design directly to the top-level "design" key — it is never
   * versioned and goes live immediately, independent of content draft/publish.
   */
  public function update_design($request)
  {
    $form_id = absint($request['id']);
    $design  = $request->get_param('design');

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    if (empty($design) || ! is_array($design)) {
      return new WP_Error('invalid_design', __('No design data provided.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots = $this->decode_slots($post->post_content);

    // Design sits at the top level — just replace it, content slots untouched.
    $json  = $this->encode_slots($slots['content']['published'], $slots['content']['draft'], $design, $slots['settings']);
    $saved = $this->save_post_content($form_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to save design.'], 500);
    }

    return new WP_REST_Response([
      'success' => true,
      'form_id' => $form_id,
      'message' => 'Design updated successfully.',
    ], 200);
  }


  /**
   * PATCH /forms/{id}/settings
   *
   * Writes settings directly to the top-level "settings" key — not versioned,
   * goes live immediately, independent of the content draft/publish cycle.
   */
  public function update_settings($request)
  {
    $form_id  = absint($request['id']);
    $settings = $request->get_param('settings');

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    if (empty($settings) || ! is_array($settings)) {
      return new WP_Error('invalid_settings', __('No settings data provided.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots = $this->decode_slots($post->post_content);

    // Merge incoming settings over defaults so any keys added in future plugin
    // updates are backfilled into existing forms on their next save.
    $merged = array_replace_recursive($this->default_settings(), $slots['settings'] ?? [], $settings);

    // Settings sit at the top level — content and design are untouched.
    $json  = $this->encode_slots($slots['content']['published'], $slots['content']['draft'], $slots['design'], $merged);
    $saved = $this->save_post_content($form_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to save settings.'], 500);
    }

    return new WP_REST_Response([
      'success' => true,
      'form_id' => $form_id,
      'message' => 'Settings updated successfully.',
    ], 200);
  }

  /**
   * POST /forms/{id}/publish
   *
   * Promotes the draft slot to published, then clears the draft slot.
   * If there is no draft, returns a 400 error.
   */
  public function publish_form($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots = $this->decode_slots($post->post_content);

    if (is_null($slots['content']['draft'])) {
      return new WP_Error('no_draft', __('No draft to publish.', 'wp-flowforms'), ['status' => 400]);
    }

    // Promote draft → published, clear draft. Design is untouched (top-level).
    $json  = $this->encode_slots($slots['content']['draft'], null, $slots['design'], $slots['settings']);
    $saved = $this->save_post_content($form_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to publish form.'], 500);
    }

    return new WP_REST_Response([
      'success' => true,
      'form_id' => $form_id,
      'message' => 'Form published successfully.',
    ], 200);
  }

  /**
   * POST /forms/{id}/revert
   *
   * Discards the draft slot. Builder falls back to published version.
   */
  public function revert_form($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots = $this->decode_slots($post->post_content);

    // Clear the draft slot, keep published and design untouched.
    $json  = $this->encode_slots($slots['content']['published'], null, $slots['design'], $slots['settings']);
    $saved = $this->save_post_content($form_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to revert form.'], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'form_id'   => $form_id,
      'content'   => $slots['content']['published'],
      'message'   => 'Form reverted to published state.',
    ], 200);
  }

  /**
   * GET /forms/{id}/public
   *
   * Returns only the PUBLISHED slot. No auth required.
   */
  public function get_form_public($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms' || $post->post_status !== 'publish') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots   = $this->decode_slots($post->post_content);
    $content = $slots['content']['published'];

    if (empty($content)) {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    return rest_ensure_response([
      'id'       => $post->ID,
      'title'    => $post->post_title,
      'content'  => $content,
      'design'   => $slots['design'],
      'settings' => $slots['settings'],
    ]);
  }

  /**
   * GET /forms/{id}/preview
   *
   * Auth-gated endpoint used by the builder's preview iframe.
   * Returns the draft slot when one exists, otherwise falls back to published.
   * This ensures the preview always reflects the current builder state,
   * even before the form has been published for the first time.
   */
  public function get_form_preview($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $slots   = $this->decode_slots($post->post_content);
    $content = $slots['content']['draft'] ?? $slots['content']['published'];

    if (empty($content)) {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    return rest_ensure_response([
      'id'       => $post->ID,
      'title'    => $post->post_title,
      'content'  => $content,
      'design'   => $slots['design'],
      'settings' => $slots['settings'],
    ]);
  }

  /**
   * Handle a form submission.
   */
  public function handle_submission(WP_REST_Request $request)
  {
    $nonce = $request->get_header('X-WP-Nonce');
    if (! wp_verify_nonce($nonce, 'wp_rest')) {
      return new WP_Error('invalid_nonce', __('Security check failed.', 'wp-flowforms'), ['status' => 403]);
    }

    $form_id = absint($request['id']);
    $post    = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms' || $post->post_status !== 'publish') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    // Submissions always validate against the PUBLISHED slot.
    $slots        = $this->decode_slots($post->post_content);
    $form_content = $slots['content']['published'];

    if (empty($form_content)) {
      return new WP_Error('invalid_form', __('Form content could not be read.', 'wp-flowforms'), ['status' => 500]);
    }

    $raw_answers = $request->get_param('answers');
    $answers     = is_array($raw_answers) ? $raw_answers : [];
    $questions   = $form_content['questions'] ?? [];
    $errors      = [];

    foreach ($questions as $question) {
      $q_id     = $question['id']       ?? '';
      $type     = $question['type']     ?? '';
      $settings = $question['settings'] ?? [];
      $content  = $question['content']  ?? [];
      $answer   = $answers[$q_id]       ?? null;

      if (! empty($settings['required']) && $this->is_empty_answer($answer, $type)) {
        $errors[$q_id] = __('This field is required.', 'wp-flowforms');
        continue;
      }

      $type_error = $this->validate_answer_type($type, $answer, $settings, $content);
      if ($type_error) {
        $errors[$q_id] = $type_error;
      }
    }

    if (! empty($errors)) {
      return new WP_REST_Response(['errors' => $errors], 422);
    }

    $sanitized = $this->sanitize_answers($answers, $questions);
    $entry_id  = $this->save_entry($form_id, $sanitized, $request);

    if (! $entry_id) {
      return new WP_REST_Response(['message' => __('Failed to save submission.', 'wp-flowforms')], 500);
    }

    do_action('wpff_form_submitted', $entry_id, $form_id, $sanitized, $form_content);

    $this->send_notifications($entry_id, $form_id, $sanitized, $form_content);

    return new WP_REST_Response(['success' => true, 'entry_id' => $entry_id], 200);
  }

  /**
   * Send email notification(s) for a new form submission.
   *
   * Errors are logged but never propagate — a failed email must not affect
   * the submission response. The entry is already saved at this point.
   *
   * @param int   $entry_id     Saved entry ID.
   * @param int   $form_id      Form post ID.
   * @param array $answers      Sanitized answers keyed by question UUID.
   * @param array $form_content Published form content (questions etc.).
   */
  private function send_notifications(int $entry_id, int $form_id, array $answers, array $form_content): void
  {
    $post = get_post($form_id);
    if (! $post) {
      return;
    }

    $slots          = $this->decode_slots($post->post_content);
    $email_settings = $slots['settings']['email'] ?? [];

    // Global kill switch — absent key means enabled (matches JS default: enabled ?? true).
    // Only bail when the admin has explicitly set enabled = false.
    if (($email_settings['enabled'] ?? true) === false) {
      return;
    }

    // Only process notifications['1']
    $notif = $email_settings['notifications']['1'] ?? [];

    $defaults = [
      'email'          => '{admin_email}',
      'subject'        => 'New submission: {form_name}',
      'sender_name'    => '{site_name}',
      'sender_address' => '{admin_email}',
      'replyto'        => '',
      'message'        => '{all_fields}',
    ];

    $notif = array_merge($defaults, array_filter($notif, fn($v) => $v !== ''));

    // Resolve smart tags in all fields
    $smart_tags = wp_flowforms()->obj('smart_tags');
    $context    = [
      'form_id'   => $form_id,
      'form_name' => $post->post_title,
      'entry_id'  => $entry_id,
      'answers'   => $answers,
      'questions' => $form_content['questions'] ?? [],
    ];

    $to             = trim($smart_tags->resolve($notif['email'],          $context));
    $subject        = $smart_tags->resolve($notif['subject'],        $context);
    $message        = $smart_tags->resolve($notif['message'],        $context);
    $sender_name    = $smart_tags->resolve($notif['sender_name'],    $context);
    $sender_address = trim($smart_tags->resolve($notif['sender_address'], $context));
    $replyto        = trim($smart_tags->resolve($notif['replyto'],        $context));

    // Skip if recipient address is invalid after resolution
    if (! is_email($to)) {
      error_log(sprintf(
        '[WP FlowForms] Email notification skipped — invalid recipient "%s" (form %d, entry %d)',
        $to, $form_id, $entry_id
      ));
      return;
    }

    // Build headers
    $headers = [
      'Content-Type: text/plain; charset=UTF-8',
      sprintf('From: %s <%s>', $sender_name, $sender_address),
    ];

    // If no reply-to is set, fall back to the sender address.
    $effective_replyto = (! empty($replyto) && is_email($replyto)) ? $replyto : $sender_address;
    if (is_email($effective_replyto)) {
      $headers[] = 'Reply-To: ' . $effective_replyto;
    }

    $sent = wp_mail($to, $subject, $message, $headers);

    if ($sent) {
      error_log(sprintf(
        '[WP FlowForms] Email notification sent to %s (form %d, entry %d)',
        $to, $form_id, $entry_id
      ));
    } else {
      error_log(sprintf(
        '[WP FlowForms] Email notification failed (form %d, entry %d)',
        $form_id, $entry_id
      ));
    }
  }

  private function is_empty_answer($answer, string $type): bool
  {
    if (is_null($answer))      return true;
    if (is_array($answer))     return count($answer) === 0;
    return trim((string) $answer) === '';
  }

  /**
   * POST /forms/from-template
   *
   * Create a new form pre-filled with a free template's content.
   *
   * @param WP_REST_Request $request
   * @return WP_REST_Response|WP_Error
   */
  public function create_form_from_template(WP_REST_Request $request)
  {
    $slug      = sanitize_key($request->get_param('template_slug') ?? '');
    $form_name = sanitize_text_field($request->get_param('form_name') ?? '');

    if (empty($slug)) {
      return new WP_Error('missing_slug', __('Template slug is required.', 'wp-flowforms'), ['status' => 400]);
    }

    $template = wp_flowforms()->obj('templates')->get($slug);

    if (! $template) {
      return new WP_Error('template_not_found', __('Template not found.', 'wp-flowforms'), ['status' => 404]);
    }

    if (empty($form_name)) {
      $form_name = $template['name'];
    }

    $post_id = wp_insert_post([
      'post_title'  => $form_name,
      'post_content' => '',
      'post_status' => 'publish',
      'post_type'   => 'wpff_forms',
    ]);

    if (is_wp_error($post_id)) {
      return new WP_REST_Response(['message' => __('Failed to create form.', 'wp-flowforms')], 500);
    }

    // Store template content in the draft slot — user must publish before it goes live.
    // Templates now store design at the top level, separate from content.
    // Merge default settings with any settings the template itself ships.
    $form_settings = array_replace_recursive($this->default_settings(), $template['settings'] ?? []);
    $json          = $this->encode_slots(null, $template['content'], $template['design'] ?? [], $form_settings);
    $saved         = $this->save_post_content($post_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => __('Failed to save form content.', 'wp-flowforms')], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'post_id'   => $post_id,
      'form_name' => $form_name,
    ], 201);
  }

  /**
   * GET /templates/{slug}/preview-url
   *
   * Stores the template content in a short-lived transient and returns a
   * signed preview URL that handle_preview() can serve without a real post.
   */
  public function get_template_preview_url(WP_REST_Request $request)
  {
    $slug     = sanitize_key($request['slug']);
    $template = wp_flowforms()->obj('templates')->get($slug);

    if (! $template) {
      return new WP_Error('template_not_found', __('Template not found.', 'wp-flowforms'), ['status' => 404]);
    }

    // Store template content in a transient keyed by slug + nonce.
    // TTL matches WP nonce lifetime (10 minutes is plenty for a preview session).
    $token           = wp_create_nonce('flowform_preview');
    $transient_key   = 'wpff_tpl_preview_' . md5($slug . $token);
    set_transient($transient_key, [
      'content' => $template['content'],
      'design'  => $template['design'] ?? [],
    ], 10 * MINUTE_IN_SECONDS);

    $preview_url = add_query_arg([
      'flowform_preview'      => '1',
      'template_slug'         => $slug,
      'template_preview_key'  => $transient_key,
      'token'                 => $token,
    ], home_url('/'));

    return rest_ensure_response(['preview_url' => $preview_url]);
  }

  private function validate_answer_type(string $type, $answer, array $settings, array $content = []): ?string
  {
    if ($this->is_empty_answer($answer, $type)) return null;

    switch ($type) {

      case 'email':
        if (! is_email((string) $answer)) {
          return __('Please enter a valid email address.', 'wp-flowforms');
        }
        break;

      case 'number':
        if (! is_numeric($answer)) {
          return __('Please enter a valid number.', 'wp-flowforms');
        }
        $num = (float) $answer;
        // Only apply min/max when explicitly set (non-empty string or numeric)
        if (isset($settings['min']) && $settings['min'] !== '' && $num < (float) $settings['min']) {
          return sprintf(__('Value must be at least %s.', 'wp-flowforms'), $settings['min']);
        }
        if (isset($settings['max']) && $settings['max'] !== '' && $num > (float) $settings['max']) {
          return sprintf(__('Value must be at most %s.', 'wp-flowforms'), $settings['max']);
        }
        break;

      case 'short_text':
      case 'long_text':
        $max_length = isset($settings['maxLength']) ? absint($settings['maxLength']) : 0;
        if ($max_length > 0 && mb_strlen((string) $answer, 'UTF-8') > $max_length) {
          return sprintf(
            /* translators: %d: maximum character limit */
            __('Please keep your answer under %d characters.', 'wp-flowforms'),
            $max_length
          );
        }
        break;

      case 'rating':
        $steps = absint($settings['steps'] ?? 5);
        $val   = (int) $answer;
        if ($val < 1 || $val > $steps) {
          return __('Please select a valid rating.', 'wp-flowforms');
        }
        break;

      case 'multiple_choice':
        if (! is_array($answer) || count($answer) === 0) {
          return __('Please make a selection.', 'wp-flowforms');
        }
        if (count($answer) > 1) {
          return __('Please select only one option.', 'wp-flowforms');
        }
        // Validate each value is either a known option or an "Other" entry
        $valid_values = array_map(
          fn($o) => $o['value'] ?? $o['label'] ?? '',
          $content['options'] ?? []
        );
        foreach ($answer as $val) {
          if ($this->is_valid_choice_value($val, $valid_values, $settings)) continue;
          return __('Invalid selection.', 'wp-flowforms');
        }
        break;

      case 'checkboxes':
        if (! is_array($answer)) {
          return __('Invalid selection.', 'wp-flowforms');
        }
        $min_sel = absint($settings['minSelections'] ?? 0);
        $max_sel = absint($settings['maxSelections'] ?? 0);
        if ($min_sel > 0 && count($answer) < $min_sel) {
          return sprintf(
            /* translators: %d: minimum number of selections required */
            _n(
              'Please select at least %d option.',
              'Please select at least %d options.',
              $min_sel,
              'wp-flowforms'
            ),
            $min_sel
          );
        }
        if ($max_sel > 0 && count($answer) > $max_sel) {
          return sprintf(
            /* translators: %d: maximum number of selections allowed */
            _n(
              'Please select at most %d option.',
              'Please select at most %d options.',
              $max_sel,
              'wp-flowforms'
            ),
            $max_sel
          );
        }
        // Validate each value is a known option or an "Other" entry
        $valid_values = array_map(
          fn($o) => $o['value'] ?? $o['label'] ?? '',
          $content['options'] ?? []
        );
        foreach ($answer as $val) {
          if ($this->is_valid_choice_value($val, $valid_values, $settings)) continue;
          return __('Invalid selection.', 'wp-flowforms');
        }
        break;

      case 'yes_no':
        if (! in_array($answer, ['yes', 'no'], true)) {
          return __('Please select yes or no.', 'wp-flowforms');
        }
        break;
    }

    return null;
  }

  /**
   * Check whether a single choice value is acceptable.
   *
   * A value is valid if it matches one of the defined option values/labels,
   * or if it is an "Other" entry in the format "__other__:<text>" and the
   * question has allowOther enabled.
   *
   * @param  mixed  $val
   * @param  array  $valid_values  Flat list of allowed option values.
   * @param  array  $settings      Question settings array.
   * @return bool
   */
  private function is_valid_choice_value($val, array $valid_values, array $settings): bool
  {
    if (in_array($val, $valid_values, true)) return true;

    if (! empty($settings['allowOther']) && is_string($val) && str_starts_with($val, '__other__:')) {
      $text = substr($val, 10);
      return trim($text) !== '';
    }

    return false;
  }

  private function sanitize_answers(array $answers, array $questions): array
  {
    $clean = [];

    foreach ($questions as $question) {
      $q_id     = $question['id']       ?? '';
      $type     = $question['type']     ?? '';
      $settings = $question['settings'] ?? [];
      $answer   = $answers[$q_id]       ?? null;

      if (is_null($answer)) {
        $clean[$q_id] = null;
        continue;
      }

      switch ($type) {
        case 'email':
          $clean[$q_id] = sanitize_email((string) $answer);
          break;

        case 'number':
        case 'rating':
          $clean[$q_id] = is_numeric($answer) ? $answer + 0 : 0;
          break;

        case 'short_text':
          $val = sanitize_text_field((string) $answer);
          $max = absint($settings['maxLength'] ?? 0);
          $clean[$q_id] = ($max > 0) ? mb_substr($val, 0, $max, 'UTF-8') : $val;
          break;

        case 'long_text':
          $val = sanitize_textarea_field((string) $answer);
          $max = absint($settings['maxLength'] ?? 0);
          $clean[$q_id] = ($max > 0) ? mb_substr($val, 0, $max, 'UTF-8') : $val;
          break;

        case 'multiple_choice':
        case 'checkboxes':
          if (! is_array($answer)) {
            $clean[$q_id] = [];
            break;
          }
          $clean[$q_id] = array_map(function ($val) {
            // Strip __other__: prefix — store only the plain text the user typed
            if (is_string($val) && str_starts_with($val, '__other__:')) {
              return sanitize_text_field(substr($val, 10));
            }
            return sanitize_text_field((string) $val);
          }, $answer);
          break;

        case 'yes_no':
          $clean[$q_id] = in_array($answer, ['yes', 'no'], true) ? $answer : null;
          break;

        default:
          $clean[$q_id] = sanitize_textarea_field((string) $answer);
          break;
      }
    }

    return $clean;
  }

  private function save_entry(int $form_id, array $sanitized_answers, WP_REST_Request $request)
  {
    global $wpdb;

    $table  = $wpdb->prefix . 'flowforms_entries';
    $result = $wpdb->insert(
      $table,
      [
        'form_id'    => $form_id,
        'answers'    => wp_json_encode($sanitized_answers, JSON_UNESCAPED_UNICODE),
        'ip_address' => $this->get_ip_address($request),
        'user_agent' => sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
        'created_at' => current_time('mysql'),
      ],
      ['%d', '%s', '%s', '%s', '%s']
    );

    return $result !== false ? (int) $wpdb->insert_id : false;
  }

  private function get_ip_address(WP_REST_Request $request): string
  {
    $headers = [
      'HTTP_CF_CONNECTING_IP',
      'HTTP_X_FORWARDED_FOR',
      'HTTP_X_REAL_IP',
      'REMOTE_ADDR',
    ];

    foreach ($headers as $header) {
      if (! empty($_SERVER[$header])) {
        $ip = trim(explode(',', $_SERVER[$header])[0]);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
          return $ip;
        }
      }
    }

    return '';
  }
}

new FlowForms_REST_API;
