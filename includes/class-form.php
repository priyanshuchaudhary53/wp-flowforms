<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Form_Handler
{
  /**
   * Allowed post types.
   *
   * @since 1.8.8
   */
  public const POST_TYPES = [
    'wpff_forms',
  ];

  public function __construct()
  {
    add_action('init', [$this, 'register_post_type']);
  }

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
      'wpff_forms_post_type_args',
      [
        'label'               => 'WP FlowForms',
        'public'              => false,
        'exclude_from_search' => true,
        'show_ui'             => true, // change later - false
        'show_in_admin_bar'   => false,
        'rewrite'             => false,
        'query_var'           => false,
        'can_export'          => false,
        'supports'            => ['title', 'author', 'revisions'],
        // 'capability_type'     => 'wpff_forms',
        // 'map_meta_cap'        => false,
      ]
    );

    // Register the post type.
    register_post_type('wpff_forms', $args);
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
    $args = (array) apply_filters('wpff_get_form_args', $args, $id);

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
     * @since 1.5.8
     *
     * @param array      $args Arguments' array, same as for `get_post()` function.
     * @param string|int $id   Form ID.
     */
    $args = apply_filters('wpff_get_single_form_args', $args, $id);

    if (! empty($args['cap']) && ! current_user_can($args['cap'], $id)) {
      return false;
    }

    // If no ID provided, we can't get a single form.
    if (empty($id)) {
      return false;
    }

    // If ID is provided, we get a single form.
    $form = get_post(absint($id));

    // Check if the form exists.
    if (empty($form) || ! $form instanceof WP_Post) {
      return false;
    }

    // Check if the form is of the allowed post type.
    if (! in_array($form->post_type, self::POST_TYPES, true)) {
      return false;
    }

    // Decode the form content.
    if (! empty($args['content_only'])) {
      $form = wpff_decode($form->post_content);
    }

    return $form;
  }

  /**
   * Fetch multiple forms.
   *
   * @since 1.0.0
   * @since 1.7.2 Added support for $args['search']['term'] - search form title or description by term.
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
     * @since 1.5.8
     *
     * @param array $args Arguments' array. Almost the same as for the `get_posts ()` function.
     */
    $args = (array) apply_filters('wpforms_get_multiple_forms_args', $args);

    // No ID provided, get multiple forms.
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
    $args['post_type'] = ! empty($post_type) ? $post_type : 'wpforms';

    $forms = get_posts($args);

    /**
     * Allow developers to filter the result of get_multiple().
     *
     * @since 1.0.0
     *
     * @param array $forms Result of getting multiple forms.
     */
    return apply_filters('wpff_form_handler_get_multiple_forms_result', $forms);
  }
}
