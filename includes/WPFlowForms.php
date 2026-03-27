<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

final class WPFlowForms
{
  /**
   * WPFlowForms instance.
   *
   * @since 1.0.0
   *
   * @var WPFlowForms
   */
  private static $instance;

  /**
   * Plugin version.
   *
   * @since 1.0.0
   *
   * @var string
   */
  public $version = '';

  /**
   * Plugin name.
   *
   * @since 1.0.0
   *
   * @var string
   */
  public $name = '';

  /**
   * Classes registry.
   *
   * @since 1.0.0
   *
   * @var array
   */
  private $registry = [];

  /**
   * Main WPFlowForms Instance.
   *
   * @since 1.0.0
   *
   * @return WPFlowForms
   */
  public static function instance()
  {

    if (self::$instance === null || ! self::$instance instanceof self) {
      self::$instance = new self();

      self::$instance->init();
    }

    return self::$instance;
  }

  /**
   * Initialize the plugin.
   *
   * @since 1.0.0
   *
   */
  private function init(): void
  {
    $this->constants();
    $this->includes();

    add_action('plugins_loaded', [self::$instance, 'objects']);
  }

  /**
   * Setup plugin constants.
   *
   * @since 1.0.0
   */
  private function constants()
  {
    $this->version = WPFF_VERSION;
    $this->name = WPFF_NAME;
  }

  /**
   * Include files.
   *
   * @since 1.0.0
   */
  private function includes()
  {
    require_once WPFF_PATH . 'includes/class-install.php';
    require_once WPFF_PATH . 'includes/class-database.php';
    require_once WPFF_PATH . 'includes/functions.php';
    require_once WPFF_PATH . 'includes/class-form.php';
    require_once WPFF_PATH . 'includes/class-entry.php';
    require_once WPFF_PATH . 'includes/class-templates.php';
    require_once WPFF_PATH . 'includes/class-smart-tags.php';
    require_once WPFF_PATH . 'includes/class-token.php';
    require_once WPFF_PATH . 'includes/class-akismet.php';
    require_once WPFF_PATH . 'includes/class-rest-api.php';
    require_once WPFF_PATH . 'includes/frontend/class-frontend.php';
    require_once WPFF_PATH . 'includes/admin/block/class-block.php';

    // Admin/Dashboard only includes
    if (is_admin()) {
      require_once WPFF_PATH . 'includes/admin/class-menu.php';
      require_once WPFF_PATH . 'includes/admin/settings/settings-api.php';
      require_once WPFF_PATH . 'includes/admin/class-settings.php';
      require_once WPFF_PATH . 'includes/admin/builder/class-builder.php';
      require_once WPFF_PATH . 'includes/admin/forms/class-forms-overview.php';
      require_once WPFF_PATH . 'includes/admin/entries/class-entries-overview.php';
      require_once WPFF_PATH . 'includes/admin/entries/class-field-icons.php';
    }
  }

  /**
   * Instantiate and register all shared plugin objects into the registry.
   *
   * @since 1.0.0
   */
  public function objects()
  {
    $this->registry['form']       = new FlowForms_Form_Handler();
    $this->registry['entry']      = new FlowForms_Entry_Handler();
    $this->registry['frontend']   = new FlowForms_Frontend();
    $this->registry['templates']  = new FlowForms_Templates();
    $this->registry['smart_tags'] = new FlowForms_Smart_Tags();
    $this->registry['token']      = new FlowForms_Token();

    /**
     * Executes when all the WPFlowForms stuff was loaded.
     *
     * @since 1.0.0
     */
    do_action('wpff_loaded');
  }

  /**
   * Get a class instance from a registry.
   *
   * @since 1.0.0
   *
   * @param string $name Class name or an alias.
   *
   * @return object|null
   */
  public function obj($name)
  {
    return $this->registry[$name] ?? null;
  }
}

/**
 * The function which returns the one WPFlowForms instance.
 *
 * @since 1.0.0
 *
 * @return WPFlowForms
 */
function wpflowforms()
{
  return WPFlowForms::instance();
}
