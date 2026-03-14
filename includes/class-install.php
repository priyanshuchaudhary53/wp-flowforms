<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Install
{
  public function __construct()
  {
    register_activation_hook(WP_FLOWFORMS_FILE, [$this, 'install']);
    register_deactivation_hook(WP_FLOWFORMS_FILE, [$this, 'deactivate']);
  }

  public function install($network_wide = false)
  {
    if ($network_wide && is_multisite()) {

      // Go through each subsite and run the installer.
      $sites = get_sites(
        [
          'fields' => 'ids',
          'number' => 0,
        ]
      );

      foreach ($sites as $blog_id) {
        switch_to_blog($blog_id);
        $this->run();
        restore_current_blog();
      }
    } else {

      // Normal single site.
      $this->run();
    }
  }

  public function deactivate() {}

  protected function run()
  {
    // Create custom database tables.
    $this->maybe_create_tables();

    /**
     * Fires before WP FlowForms plugin installation is performed.
     *
     * @since 1.3.0
     */
    do_action('wpff_install', $this);
  }

  private function maybe_create_tables()
  {
    FlowForms_Database::create_tables();
  }
}

new FlowForms_Install();
