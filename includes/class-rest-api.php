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

    // GET all forms (for list page)
    // register_rest_route($ns, '/forms', [
    //   'methods'  => 'GET',
    //   'callback' => [$this, 'get_forms'],
    //   'permission_callback' => fn() => current_user_can('edit_posts'),
    // ]);

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

    // PUT update form (builder auto-saves here)
    register_rest_route($ns, '/forms/(?P<id>\d+)', [
      'methods'  => 'PATCH',
      'callback' => [$this, 'update_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST submit (public — no auth needed)
    // register_rest_route($ns, '/submit/(?P<id>\d+)', [
    //   'methods'  => 'POST',
    //   'callback' => [$this, 'submit_form'],
    //   'permission_callback' => '__return_true',
    // ]);
  }

  public function get_form($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error(
        'invalid_form_id',
        __('Invalid form ID.', 'wp-flowforms'),
        ['status' => 400]
      );
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error(
        'form_not_found',
        __('Form not found.', 'wp-flowforms'),
        ['status' => 404]
      );
    }

    $form = [
      'id'            => $post->ID,
      'title'         => $post->post_title,
      'status'        => $post->post_status,
      'content'       => wpff_decode($post->post_content),
      'date_created'  => $post->post_date,
      'date_updated'  => $post->post_modified,
    ];

    return rest_ensure_response($form);
  }

  public function create_form($request)
  {
    // Get params
    $form_name = sanitize_text_field($request->get_param('form_name'));
    $form_data = $request->get_param('form_data');

    // Default form name
    if (empty($form_name)) {
      $form_name = __('Untitled form', 'wp-flowforms');
    }

    // Decode JSON if needed
    if (is_string($form_data)) {
      $decoded = json_decode($form_data, true);
      if (json_last_error() === JSON_ERROR_NONE) {
        $form_data = $decoded;
      }
    }

    // Use default if empty
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

    $saved = $this->save_post_content($post_id, $this->encode_form_data($form_data));

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

    // Update title via wp_update_post (plain text, no emoji risk)
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

    // Update content directly via $wpdb to preserve emoji
    if (! is_null($form_data)) {

      if (is_string($form_data)) {
        $decoded = json_decode($form_data, true);
        if (json_last_error() === JSON_ERROR_NONE) {
          $form_data = $decoded;
        }
      }

      if (! empty($form_data)) {
        $saved = $this->save_post_content($form_id, $this->encode_form_data($form_data));

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
      'success' => true,
      'form_id' => $form_id,
      'message' => 'Form updated successfully.',
    ], 200);
  }

  /**
   * Encode form data to JSON preserving emoji and special characters.
   *
   * wp_json_encode() without flags escapes every non-ASCII codepoint to
   * \uXXXX sequences (e.g. 🙌 → \ud83d\ude4c). When wp_insert_post /
   * wp_update_post then run wp_slash() on the string, those backslashes get
   * doubled and the sequences become unreadable on the next json_decode().
   *
   * JSON_UNESCAPED_UNICODE stores emoji as literal UTF-8 bytes so slashing
   * can never corrupt them. JSON_UNESCAPED_SLASHES keeps the JSON compact.
   */
  private function encode_form_data(array $data)
  {
    return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }

  /**
   * Write post_content directly via $wpdb to bypass wp_insert_post /
   * wp_update_post's internal wp_slash() call, which would corrupt the
   * literal UTF-8 emoji characters we stored above.
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
}

new FlowForms_REST_API;
