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
  }

  /**
   * Decode the raw post_content into the dual-slot structure.
   *
   * Legacy forms (plain JSON, no wrapper) are treated as published-only with
   * no draft. New forms are stored as:
   *   { "published": { ...formContent }, "draft": { ...formContent } | null }
   *
   * @param  string $raw  Raw post_content string.
   * @return array{ published: array|null, draft: array|null }
   */
  private function decode_slots(string $raw): array
  {
    if (empty($raw)) {
      return ['published' => null, 'draft' => null];
    }

    $decoded = wpff_decode($raw);

    if (! is_array($decoded)) {
      return ['published' => null, 'draft' => null];
    }

    // New dual-slot format: must have a "published" key at top level.
    if (array_key_exists('published', $decoded)) {
      return [
        'published' => $decoded['published'] ?? null,
        'draft'     => $decoded['draft']     ?? null,
      ];
    }

    // Legacy format: the entire decoded array IS the form content.
    // Treat it as published with no draft.
    return [
      'published' => $decoded,
      'draft'     => null,
    ];
  }

  /**
   * Encode both slots back into a single JSON string for post_content.
   *
   * @param  array|null $published
   * @param  array|null $draft
   * @return string
   */
  private function encode_slots(?array $published, ?array $draft): string
  {
    return wp_json_encode(
      ['published' => $published, 'draft' => $draft],
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
    $has_draft = ! is_null($slots['draft']);

    // Builder always loads the draft when one exists, otherwise published.
    $content = $has_draft ? $slots['draft'] : $slots['published'];

    $form = [
      'id'           => $post->ID,
      'title'        => $post->post_title,
      'status'       => $post->post_status,
      'content'      => $content,
      'has_draft'    => $has_draft,
      'has_published' => ! is_null($slots['published']),
      'date_created' => $post->post_date,
      'date_updated' => $post->post_modified,
      'public_url'   => FlowForms_Frontend::get_public_url($post->ID),
      'preview_url'  => FlowForms_Frontend::get_preview_url($post->ID),
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
    $json  = $this->encode_slots(null, $form_data);
    $saved = $this->save_post_content($post_id, $json);

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
        $json  = $this->encode_slots($slots['published'], $form_data);
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
   * Writes the design object directly into the published slot so design
   * changes are always live immediately. If a draft slot also exists, the
   * design is mirrored there too so the builder canvas stays in sync.
   */
  public function update_design($request)
  {
    $form_id    = absint($request['id']);
    $design     = $request->get_param('design');

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

    // Write design into published slot.
    if (! empty($slots['published'])) {
      $slots['published']['design'] = $design;
    } else {
      // Form has never been published — create a minimal published entry
      // so design is preserved even before first publish.
      $slots['published'] = ['design' => $design];
    }

    // Mirror design into draft slot so the builder canvas reflects it.
    if (! is_null($slots['draft'])) {
      $slots['draft']['design'] = $design;
    }

    $json  = $this->encode_slots($slots['published'], $slots['draft']);
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

    if (is_null($slots['draft'])) {
      return new WP_Error('no_draft', __('No draft to publish.', 'wp-flowforms'), ['status' => 400]);
    }

    // Promote draft → published, clear draft.
    $json  = $this->encode_slots($slots['draft'], null);
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

    // Clear the draft slot, keep published untouched.
    $json  = $this->encode_slots($slots['published'], null);
    $saved = $this->save_post_content($form_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to revert form.'], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'form_id'   => $form_id,
      'content'   => $slots['published'],
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
    $content = $slots['published'];

    if (empty($content)) {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    return rest_ensure_response([
      'id'      => $post->ID,
      'title'   => $post->post_title,
      'content' => $content,
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
    $content = $slots['draft'] ?? $slots['published'];

    if (empty($content)) {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    return rest_ensure_response([
      'id'      => $post->ID,
      'title'   => $post->post_title,
      'content' => $content,
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
    $form_content = $slots['published'];

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

    return new WP_REST_Response(['success' => true, 'entry_id' => $entry_id], 200);
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
    $content = $template['content'];
    $json    = $this->encode_slots(null, $content);
    $saved   = $this->save_post_content($post_id, $json);

    if (! $saved) {
      return new WP_REST_Response(['message' => __('Failed to save form content.', 'wp-flowforms')], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'post_id'   => $post_id,
      'form_name' => $form_name,
    ], 201);
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
