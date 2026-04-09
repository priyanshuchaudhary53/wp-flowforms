<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Install
{
  /**
   * Register activation and deactivation hooks.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    register_activation_hook(WPFF_FILE, [$this, 'install']);
    register_deactivation_hook(WPFF_FILE, [$this, 'deactivate']);
  }

  /**
   * Run plugin installation, iterating all sites on multisite if needed.
   *
   * @since 1.0.0
   *
   * @param bool $network_wide Whether the plugin is being activated network-wide.
   */
  public function install($network_wide = false)
  {
    if ($network_wide && is_multisite()) {

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
      $this->run();
    }
  }

  /**
   * Flush rewrite rules on plugin deactivation to remove custom routing.
   *
   * @since 1.0.0
   */
  public function deactivate()
  {
    // Remove our rewrite rules and flush so WordPress stops routing
    // /flowform/{id} requests after the plugin is deactivated.
    flush_rewrite_rules();
  }

  /**
   * Perform the actual installation steps for a single site.
   *
   * @since 1.0.0
   */
  protected function run()
  {
    $this->maybe_create_tables();

    // Register our rewrite rules NOW (before flushing) so they are
    // included in the ruleset that gets written to the database.
    // We cannot rely on the init hook here because the activation hook
    // fires before init, so the rules would not exist yet when we flush.
    $this->register_rewrite_rules();
    flush_rewrite_rules();

    /**
     * Fires after FlowForms plugin installation is performed.
     *
     * @since 1.0.0
     */
    do_action('wpff_install', $this);
  }

  /**
   * Register the /flowform/{id} rewrite rule directly during activation.
   *
   * Duplicates the rule from FlowForms_Frontend::register_rewrites() so it
   * exists in the global WP_Rewrite object at flush time. On every subsequent
   * request the rule is re-registered normally via the init hook in
   * FlowForms_Frontend, so there is no duplication risk.
   */
  private function register_rewrite_rules()
  {
    add_rewrite_rule(
      '^flowform/(\d+)/?$',
      'index.php?flowform_id=$matches[1]',
      'top'
    );

    add_rewrite_tag( '%flowform_id%', '(\d+)' );
  }

  /**
   * Create or upgrade the plugin database tables if they do not exist.
   *
   * @since 1.0.0
   */
  private function maybe_create_tables()
  {
    FlowForms_Database::create_tables();
  }
}

new FlowForms_Install();
