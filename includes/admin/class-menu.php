<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Admin_Menu
{
  public function __construct()
  {
    if (is_admin()) {
      // Add admin pages
      add_action('admin_menu', [$this, 'add_admin_pages']);
    }
  }

  public function add_admin_pages()
  {
    // Set page title.
    $title = wp_flowforms()->name;
    $title_suffix = ' &lsaquo; ' . $title;

    add_menu_page(
      __('All Forms', 'wp-flowforms') . $title_suffix,
      $title,
      'manage_options',
      'wpff_forms',
      [$this, 'admin_page'],
      'dashicons-admin-generic', // plugins_url('myplugin/images/icon.png'), // change later
      /**
       * Filters WP FlowForms menu position.
       *
       * @since 1.0.0
       *
       * @param string|int|float $position Menu position.
       */
      apply_filters('wpff_menu_position', '58'),
    );

    add_submenu_page('wpff_forms', $title, 'All Forms', 'manage_options', 'wpff_forms', [$this, 'admin_page'], 0);
    add_submenu_page('wpff_forms', $title . ' ' . __('Builder', 'wp-flowforms'), __('Add New Form', 'wp-flowforms'), 'manage_options', 'wpff_form_builder', [$this, 'admin_page']);
    add_submenu_page('wpff_forms', __('Entries', 'wp-flowforms') . $title_suffix, __('Entries', 'wp-flowforms'), 'manage_options', 'wpff_entries', [$this, 'admin_page']);
    add_submenu_page('wpff_forms', __('Settings', 'wp-flowforms') . $title_suffix, __('Settings', 'wp-flowforms'), 'manage_options', 'wpff_settings', [$this, 'admin_page']);

    /**
     * Fires after constructing the WP FlowForms admin menu.
     *
     * @since 1.0.0
     */
    do_action('wpff_admin_menu', $this);
  }

  public function admin_page()
  {
    /**
     * Fires to show the WP FlowForms admin page.
     *
     * @since 1.0.0
     */
    do_action('wpff_admin_page');
  }
}

new FlowForms_Admin_Menu();
