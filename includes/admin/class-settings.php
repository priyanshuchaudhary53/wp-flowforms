<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Settings
{
  /**
   * Registers admin_init hook to initialise the settings page.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    add_action('admin_init', [$this, 'init']);
  }

  /**
   * Initialises the settings page hooks; bails if not on the settings screen.
   *
   * @since 1.0.0
   */
  public function init()
  {
    if (! wpff_is_admin_page('settings')) {
      return;
    }

    add_action('wpff_admin_page', [$this, 'output']);

    // Hook for addons.
    do_action('wpff_settings_init', $this);
  }

  /**
   * Renders the settings page HTML output.
   *
   * @since 1.0.0
   */
  public function output() {
    ?>
    <div class="wrap">
      <h2>Settings</h2>
    </div>

    <?php
  }
}

new FlowForms_Settings();
