<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Admin_Menu
{
  /**
   * Registers the admin_menu hook when in the admin context.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    if (is_admin()) {
      add_action('admin_menu', [$this, 'add_admin_pages']);
    }
  }

  /**
   * Registers all FlowForms admin menu and submenu pages.
   *
   * @since 1.0.0
   */
  public function add_admin_pages()
  {
    $title = flowforms()->name;
    $title_suffix = ' &lsaquo; ' . $title;

    add_menu_page(
      __('All Forms', 'flowforms') . $title_suffix,
      $title,
      'manage_options',
      'flowforms_forms',
      [$this, 'admin_page'],
      'dashicons-feedback', // plugins_url('myplugin/images/icon.png'), // change later
      /**
       * Filters FlowForms menu position.
       *
       * @since 1.0.0
       *
       * @param string|int|float $position Menu position.
       */
      apply_filters('flowforms_menu_position', '58'),
    );

    add_submenu_page('flowforms_forms', $title, 'All Forms', 'manage_options', 'flowforms_forms', [$this, 'admin_page'], 0);
    add_submenu_page('flowforms_forms', $title . ' ' . __('Builder', 'flowforms'), __('Add New Form', 'flowforms'), 'manage_options', 'flowforms_form_builder', [$this, 'admin_page']);
    add_submenu_page('flowforms_forms', __('Entries', 'flowforms') . $title_suffix, __('Entries', 'flowforms'), 'manage_options', 'flowforms_entries', [$this, 'admin_page']);
    add_submenu_page('flowforms_forms', __('Settings', 'flowforms') . $title_suffix, __('Settings', 'flowforms'), 'manage_options', 'flowforms_settings', [$this, 'admin_page']);

    /**
     * Fires after constructing the FlowForms admin menu.
     *
     * @since 1.0.0
     */
    do_action('flowforms_admin_menu', $this);
  }

  /**
   * Fires the flowforms_admin_page action to render the current admin page.
   *
   * @since 1.0.0
   */
  public function admin_page()
  {
    /**
     * Fires to show the FlowForms admin page.
     *
     * @since 1.0.0
     */
    do_action('flowforms_admin_page');
  }
}

new FlowForms_Admin_Menu();
