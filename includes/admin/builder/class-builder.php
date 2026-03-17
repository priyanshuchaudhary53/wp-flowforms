<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Builder
{
  /**
   * FlowForms_Builder instance.
   *
   * @since 1.0.0
   *
   * @var object
   */
  private static $instance;

  /**
   * Current view (panel).
   *
   * @since 1.0.0
   *
   * @var string
   */
  public $view;

  /**
   * Current form.
   *
   * @since 1.0.0
   *
   * @var WP_Post|null
   */
  public $form;

  /**
   * Form data and settings.
   *
   * @since 1.0.0
   *
   * @var array
   */
  public $form_data;

  public static function instance()
  {
    if (! isset(self::$instance) && ! (self::$instance instanceof self)) {

      self::$instance = new self();

      add_action('admin_init', [self::$instance, 'init']);
      add_action('admin_init', [self::$instance, 'deregister_admin_styles'], PHP_INT_MAX);
    }

    return self::$instance;
  }

  public function init()
  {
    // Only load on the builder.
    if (! wpff_is_admin_page('form_builder')) {
      return;
    }

    // Load form if found.
    $form_id = isset($_GET['form_id']) ? absint($_GET['form_id']) : false;

    // Abort early if form ID is set, but the value is empty, 0 or any non-numeric value.
    if ($form_id === 0) {
      wp_die(esc_html__('It looks like the form you are trying to access is no longer available.', 'wp-flowforms'), 403);
    }

    if ($form_id) {
      // The default view for with an existing form is the fields panel.
      $this->view = isset($_GET['view']) ? sanitize_key($_GET['view']) : 'fields';
    } else {
      // The default view for the new form is the setup panel.
      $this->view = isset($_GET['view']) ? sanitize_key($_GET['view']) : 'setup';
    }

    if ($this->view === 'setup' && ! current_user_can('manage_options')) {
      wp_die(esc_html__('Sorry, you are not allowed to create new forms.', 'wp-flowforms'), 403);
    }

    if ($this->view === 'fields' && ! current_user_can('manage_options')) {
      wp_die(esc_html__('Sorry, you are not allowed to edit this form.', 'wp-flowforms'), 403);
    }

    // Fetch form.
    $form_obj   = wp_flowforms()->obj('form');
    $this->form = $form_obj ? $form_obj->get($form_id) : null;

    if (! empty($form_id) && empty($this->form)) {
      wp_die(esc_html__('It looks like the form you are trying to access is no longer available.', 'wp-flowforms'), 403);
    }

    if (! empty($this->form->post_status) && $this->form->post_status === 'trash') {
      wp_die(esc_html__('You can\'t edit this form because it\'s in the trash.', 'wp-flowforms'), 403);
    }

    // Retrieve form data.
    $this->form_data = $this->form ? wpff_decode($this->form->post_content) : false;

    add_action('admin_head', [$this, 'admin_head']);
    add_action('admin_enqueue_scripts', [$this, 'enqueues'], PHP_INT_MAX);
    add_action('wpff_admin_page', [$this, 'output']);

    /**
     * Form Builder init action.
     *
     * Executes after all the form builder UI output.
     *
     * @since 1.0.0
     *
     * @param string $view Current view.
     */
    do_action('wpff_builder_init', $this->view);
  }

  public function deregister_admin_styles()
  {
    if (! wpff_is_admin_page('form_builder')) {
      return;
    }

    /**
     * Filter the allowed common wp-admin styles.
     *
     * @since 1.0.0
     *
     * @param array $allowed_styles Styles allowed in the Form Builder.
     */
    $allowed_styles = apply_filters(
      'wpff_admin_builder_allowed_admin_styles',
      [
        'wp-editor',
        'wp-editor-font',
        'editor-buttons',
        'dashicons',
        'media-views',
        'imgareaselect',
        'wp-mediaelement',
        'mediaelement',
        'buttons',
        'admin-bar',
      ]
    );

    wp_styles()->registered = array_intersect_key(wp_styles()->registered, array_flip($allowed_styles));
  }

  public function admin_head()
  {
    // Force hide an admin side menu.
    echo '<style>#adminmenumain { display: none !important }</style>';

    /**
     * Form Builder admin head action.
     *
     * @param string $view Current view.
     *
     * @since 1.0.0
     */
    do_action('wpff_builder_admin_head', $this->view);
  }

  public function enqueues()
  {
    wp_enqueue_media();

    $asset = include WP_FLOWFORMS_PATH . 'build/index.asset.php';

    wp_enqueue_script(
      'wp-flowforms-builder',
      WP_FLOWFORMS_URL . 'build/index.js',
      $asset['dependencies'],
      $asset['version'],
      true
    );

    wp_enqueue_style(
      'wp-flowforms-builder',
      WP_FLOWFORMS_URL . 'build/style-index.css',
      [],
      $asset['version']
    );

    wp_localize_script('wp-flowforms-builder', 'formflowData', [
      'apiUrl'        => rest_url('formflow/v1'),
      'adminFormsUrl' => admin_url('admin.php?page=wpff_forms'),
      'nonce'         => wp_create_nonce('wp_rest'),
      'formId'        => intval($_GET['form_id'] ?? 0),
    ]);
  }

  public function output()
  {
    /**
     * Allow developers to disable Form Builder output.
     *
     * @since 1.0.0
     *
     * @param bool $is_enabled Is builder output enabled? Defaults to `true`.
     */
    if (! apply_filters('wpff_builder_output', true)) {
      return;
    }

    $form_id         = $this->form ? absint($this->form->ID) : '';
?>
    <div id="wpff-builder" data-view="<?php echo $this->view; ?>"></div>
<?php
  }
}

FlowForms_Builder::instance();
