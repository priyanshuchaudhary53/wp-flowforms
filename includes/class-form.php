<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Form_Handler
{
  /**
   * Allowed post types.
   *
   * @since 1.0.0
   */
  public const POST_TYPES = [
    'flowforms_forms',
  ];

  /**
   * Register WordPress hooks for post type registration and entry cascade-delete.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    add_action('init', [$this, 'register_post_type']);

    // Cascade-delete entries when a form is permanently deleted.
    add_action('before_delete_post', [$this, 'delete_form_entries'], 10, 2);
  }

  /**
   * Register the flowforms_forms custom post type with WordPress.
   *
   * @since 1.0.0
   */
  public function register_post_type()
  {
    /**
     * Filters Custom Post Type arguments.
     *
     * @since 1.0.0
     *
     * @param array $args Arguments.
     */
    $args = apply_filters(
      'flowforms_forms_post_type_args',
      [
        'label'               => 'FlowForms',
        'public'              => false,
        'exclude_from_search' => true,
        'show_ui'             => false,
        'show_in_admin_bar'   => false,
        'rewrite'             => false,
        'query_var'           => false,
        'can_export'          => false,
        'show_in_rest'        => true,
        'supports'            => ['title', 'author', 'revisions'],
        // 'capability_type'     => 'flowforms_forms',
        // 'map_meta_cap'        => false,
      ]
    );

    register_post_type('flowforms_forms', $args);
  }

  /**
   * Permanently delete all entries belonging to a form when the form itself
   * is permanently deleted.
   *
   * Hooked to `before_delete_post` which fires only on permanent deletion,
   * not when a form is moved to trash — allowing the user to restore the form
   * and keep its entries intact until the final delete.
   *
   * @since 1.0.0
   *
   * @param int     $post_id Post ID being deleted.
   * @param WP_Post $post    Post object.
   */
  public function delete_form_entries(int $post_id, WP_Post $post): void
  {
    if (! in_array($post->post_type, self::POST_TYPES, true)) {
      return;
    }

    $entry = flowforms()->obj('entry');

    if (! $entry) {
      return;
    }

    global $wpdb;

    $table = FlowForms_Entry_Handler::table();

    $wpdb->delete($table, ['form_id' => $post_id], ['%d']);
  }

  /**
   * Fetch forms.
   *
   * @since 1.0.0
   *
   * @param mixed $id   Form ID.
   * @param array $args Additional arguments array.
   *
   * @return array|false|WP_Post
   */
  public function get($id = '', array $args = [])
  {

    if ($id === false) {
      return false;
    }

    /**
     * Allow developers to filter the FlowForms_Form_Handler::get() arguments.
     *
     * @since 1.0.0
     *
     * @param array $args Arguments array.
     * @param mixed $id   Form ID.
     */
    $args = (array) apply_filters('flowforms_get_form_args', $args, $id);

    // By default, we should return only published forms.
    $defaults = [
      'post_status' => 'publish',
    ];

    $args = wp_parse_args($args, $defaults);

    $forms = empty($id) ? $this->get_multiple($args) : $this->get_single($id, $args);

    return ! empty($forms) ? $forms : false;
  }

  /**
   * Fetch a single form.
   *
   * @since 1.0.0
   *
   * @param string|int $id   Form ID.
   * @param array      $args Additional arguments array.
   *
   * @return array|false|WP_Post
   */
  protected function get_single($id = '', array $args = [])
  {
    /**
     * Allow developers to filter the get_single() arguments.
     *
     * @since 1.0.0
     *
     * @param array      $args Arguments' array, same as for `get_post()` function.
     * @param string|int $id   Form ID.
     */
    $args = apply_filters('flowforms_get_single_form_args', $args, $id);

    if (! empty($args['cap']) && ! current_user_can($args['cap'], $id)) {
      return false;
    }

    if (empty($id)) {
      return false;
    }

    $form = get_post(absint($id));

    if (empty($form) || ! $form instanceof WP_Post) {
      return false;
    }

    if (! in_array($form->post_type, self::POST_TYPES, true)) {
      return false;
    }

    if (! empty($args['content_only'])) {
      $form = flowforms_decode($form->post_content);
    }

    return $form;
  }

  /**
   * Fetch multiple forms.
   *
   * @since 1.0.0
   *
   * @param array $args Additional arguments array.
   *
   * @return array
   */
  protected function get_multiple(array $args = [])
  {
    /**
     * Allow developers to filter the get_multiple() arguments.
     *
     * @since 1.0.0
     *
     * @param array $args Arguments' array. Almost the same as for the `get_posts ()` function.
     */
    $args = (array) apply_filters('flowforms_get_multiple_forms_args', $args);

    $defaults = [
      'orderby'          => 'id',
      'order'            => 'ASC',
      'no_found_rows'    => true,
      'nopaging'         => true,
      'suppress_filters' => false,
    ];

    $args = wp_parse_args($args, $defaults);

    $post_type = $args['post_type'] ?? [];

    // Post type should be one of the allowed post types.
    $post_type = array_intersect((array) $post_type, self::POST_TYPES);

    // If no valid (allowed) post types are provided, use the default one.
    $args['post_type'] = ! empty($post_type) ? $post_type : 'flowforms_forms';

    $forms = get_posts($args);

    /**
     * Allow developers to filter the result of get_multiple().
     *
     * @since 1.0.0
     *
     * @param array $forms Result of getting multiple forms.
     */
    return apply_filters('flowforms_form_handler_get_multiple_forms_result', $forms);
  }
}
