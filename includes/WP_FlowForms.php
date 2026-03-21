<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

final class WP_FlowForms
{
  /**
   * WP_FlowForms instance.
   *
   * @since 1.0.0
   *
   * @var WP_FlowForms
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
   * Main WP_FlowForms Instance.
   *
   * @since 1.0.0
   *
   * @return WP_FlowForms
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
    $this->version = WP_FLOWFORMS_VERSION;
    $this->name = WP_FLOWFORMS_NAME;
  }

  /**
   * Include files.
   *
   * @since 1.0.0
   */
  private function includes()
  {
    // Autoload classes
    require_once WP_FLOWFORMS_PATH . 'includes/class-install.php';
    require_once WP_FLOWFORMS_PATH . 'includes/class-database.php';
    require_once WP_FLOWFORMS_PATH . 'includes/class-post-types.php';
    require_once WP_FLOWFORMS_PATH . 'includes/functions.php';
    require_once WP_FLOWFORMS_PATH . 'includes/class-form.php';
    require_once WP_FLOWFORMS_PATH . 'includes/class-entry.php';
    require_once WP_FLOWFORMS_PATH . 'includes/class-rest-api.php';
    require_once WP_FLOWFORMS_PATH . 'includes/frontend/class-frontend.php';
    require_once WP_FLOWFORMS_PATH . 'includes/admin/block/class-block.php';

    // Admin/Dashboard only includes
    if (is_admin()) {
      require_once WP_FLOWFORMS_PATH . 'includes/admin/class-menu.php';
      require_once WP_FLOWFORMS_PATH . 'includes/admin/class-settings.php';
      require_once WP_FLOWFORMS_PATH . 'includes/admin/builder/class-builder.php';
      require_once WP_FLOWFORMS_PATH . 'includes/admin/forms/class-forms-overview.php';
      require_once WP_FLOWFORMS_PATH . 'includes/admin/entries/class-entries-overview.php';
      require_once WP_FLOWFORMS_PATH . 'includes/admin/entries/class-field-icons.php';
    }
  }

  public function objects()
  {
    $this->registry['form']     = new FlowForms_Form_Handler();
    $this->registry['entry']    = new FlowForms_Entry_Handler();
    $this->registry['frontend'] = new FlowForms_Frontend();

    /**
     * Executes when all the WPForms stuff was loaded.
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
 * The function which returns the one WP_FlowForms instance.
 *
 * @since 1.0.0
 *
 * @return WP_FlowForms
 */
function wp_flowforms()
{
  return WP_FlowForms::instance();
}
