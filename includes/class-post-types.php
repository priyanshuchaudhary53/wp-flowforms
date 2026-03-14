<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Post_Types
{
  public function __construct()
  {
    // add_action('init', [$this, 'register_post_types']);
  }

  public function register_post_types()
  {
    $post_types = $this->get_post_types();

    foreach ($post_types as $slug => $args) {
      register_post_type($slug, $args);
    }
  }

  private function get_post_types()
  {
    $post_types = [

      'wpff_forms' => [
        'labels' => [
          'name'               => __('Forms', 'wp-flowforms'),
          'singular_name'      => __('Form', 'wp-flowforms'),
          'add_new'            => __('Add New', 'wp-flowforms'),
          'add_new_item'       => __('Add New Form', 'wp-flowforms'),
          'edit_item'          => __('Edit Form', 'wp-flowforms'),
          'new_item'           => __('New Form', 'wp-flowforms'),
          'view_item'          => __('View Form', 'wp-flowforms'),
          'search_items'       => __('Search Forms', 'wp-flowforms'),
          'not_found'          => __('No forms found', 'wp-flowforms'),
          'not_found_in_trash' => __('No forms found in trash', 'wp-flowforms'),
        ],

        'public'       => false,
        'show_ui'      => true,
        'menu_icon'    => 'dashicons-feedback',
        'supports'     => ['title'],
        'capability_type' => 'post',
        'hierarchical' => false,
        'rewrite'      => false,
        'query_var'    => false,
      ],

    ];

    /**
     * Allow developers to register additional CPTs.
     * 
     * @since 1.0.0
     * 
     * @param array $post_types Array of post type definitions keyed by post type slug.
     * @return array Filtered array of post type definitions.
     */
    return apply_filters('wpff_post_types', $post_types);
  }
}

new FlowForms_Post_Types();
