<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Settings
{
  public function __construct()
  {
    add_action('admin_init', [$this, 'init']);
  }

  public function init()
  {
    // Only load on the settings page.
    if (! wpff_is_admin_page('settings')) {
      return;
    }

    add_action('wpff_admin_page', [$this, 'output']);

    // Hook for addons.
    do_action('wpff_settings_init', $this);
  }

  public function output() {
    ?>
    <div class="wrap">
      <h2>Settings</h2>
    </div>

    <?php
  }
}

new FlowForms_Settings();
