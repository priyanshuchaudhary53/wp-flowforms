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
      add_action('admin_head', [$this, 'adjust_pro_menu_item']);
      add_action('admin_head', [$this, 'admin_menu_styles']);
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
    add_submenu_page('flowforms_forms', __('Upgrade to Pro', 'flowforms'), __('Upgrade to Pro', 'flowforms'), 'manage_options', flowforms_pro_url('admin_menu', 'upgrade_link'));

    /**
     * Fires after constructing the FlowForms admin menu.
     *
     * @since 1.0.0
     */
    do_action('flowforms_admin_menu', $this);
  }

  /**
   * Adds a CSS class to the "Upgrade to Pro" submenu item for styling.
   *
   * @since 1.1.0
   */
  public function adjust_pro_menu_item()
  {
    global $submenu;

    if (empty($submenu['flowforms_forms'])) {
      return;
    }

    foreach ($submenu['flowforms_forms'] as $position => $item) {
      if (strpos($item[2], 'wpflowforms.com/pro') === false) {
        continue;
      }

      // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- Standard WP pattern for adding CSS classes to submenu items.
      if (isset($submenu['flowforms_forms'][$position][4])) {
        $submenu['flowforms_forms'][$position][4] .= ' wpff-sidebar-upgrade-pro';
      } else {
        $submenu['flowforms_forms'][$position][4] = 'wpff-sidebar-upgrade-pro';
      }

      break;
    }
  }

  /**
   * Outputs inline CSS for the admin menu.
   *
   * @since 1.1.0
   */
  public function admin_menu_styles()
  {
    $styles = 'a.wpff-sidebar-upgrade-pro { background-color: #00a32a !important; color: #fff !important; font-weight: 600 !important;}';

    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    printf('<style>%s</style>', $styles);
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
