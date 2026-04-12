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

  /**
   * Returns the singleton instance, creating it on the first call.
   *
   * @since 1.0.0
   */
  public static function instance()
  {
    if (! isset(self::$instance) && ! (self::$instance instanceof self)) {

      self::$instance = new self();

      add_action('admin_init', [self::$instance, 'init']);
      add_action('admin_init', [self::$instance, 'deregister_admin_styles'], PHP_INT_MAX);
    }

    return self::$instance;
  }

  /**
   * Initialises builder state and hooks; bails if not on the form builder page.
   *
   * @since 1.0.0
   */
  public function init()
  {
    if (! flowforms_is_admin_page('form_builder')) {
      return;
    }

    if (! current_user_can('edit_posts')) {
      return;
    }

    $nonce       = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
    $nonce_valid = wp_verify_nonce( $nonce, 'flowforms_builder_nav' );

    $form_id = $nonce_valid && isset( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : false;

    // Abort early if form ID is set, but the value is empty, 0 or any non-numeric value.
    if ($form_id === 0) {
      wp_die(esc_html__('It looks like the form you are trying to access is no longer available.', 'flowforms'), 403);
    }

    if ($form_id) {
      // The default view for with an existing form is the builder panel.
      $allowed_views  = ['builder', 'settings', 'share'];
      $requested_view = $nonce_valid && isset( $_GET['view'] ) ? sanitize_key( $_GET['view'] ) : 'builder';
      $this->view     = in_array($requested_view, $allowed_views, true) ? $requested_view : 'builder';
    } else {
      // The default view for the new form is the setup panel.
      $this->view = $nonce_valid && isset( $_GET['view'] ) ? sanitize_key( $_GET['view'] ) : 'setup';
    }

    if ($this->view === 'setup' && ! current_user_can('manage_options')) {
      wp_die(esc_html__('Sorry, you are not allowed to create new forms.', 'flowforms'), 403);
    }

    if ($this->view === 'builder' && ! current_user_can('manage_options')) {
      wp_die(esc_html__('Sorry, you are not allowed to edit this form.', 'flowforms'), 403);
    }

    $form_obj   = flowforms()->obj('form');
    $this->form = $form_obj ? $form_obj->get($form_id) : null;

    if (! empty($form_id) && empty($this->form)) {
      wp_die(esc_html__('It looks like the form you are trying to access is no longer available.', 'flowforms'), 403);
    }

    if (! empty($this->form->post_status) && $this->form->post_status === 'trash') {
      wp_die(esc_html__('You can\'t edit this form because it\'s in the trash.', 'flowforms'), 403);
    }

    $this->form_data = $this->form ? flowforms_decode($this->form->post_content) : false;

    add_action('admin_head', [$this, 'admin_head']);
    add_action('admin_enqueue_scripts', [$this, 'enqueues'], PHP_INT_MAX);
    add_action('flowforms_admin_page', [$this, 'output']);

    /**
     * Form Builder init action.
     *
     * Executes after all the form builder UI output.
     *
     * @since 1.0.0
     *
     * @param string $view Current view.
     */
    do_action('flowforms_builder_init', $this->view);
  }

  /**
   * Removes all wp-admin stylesheets except those needed by the builder.
   *
   * @since 1.0.0
   */
  public function deregister_admin_styles()
  {
    if (! flowforms_is_admin_page('form_builder')) {
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
      'flowforms_admin_builder_allowed_admin_styles',
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

  /**
   * Outputs the page-loader overlay styles and markup in the admin <head>.
   *
   * @since 1.0.0
   */
  public function admin_head()
  {
    echo '<div id="wpff-page-loader" aria-hidden="true">
      <div class="wpff-loader-content">
        <div class="wpff-loader-logo">
          <img width="36" height="36" src="' . esc_url( FLOWFORMS_URL ) . 'assets/images/flowforms-logo.svg" />
        </div>
        <div class="wpff-loader-spinner" role="status">
          <span class="screen-reader-text">' . esc_html__('Loading…', 'flowforms') . '</span>
        </div>
      </div>
    </div>';

    /**
     * Form Builder admin head action.
     *
     * @param string $view Current view.
     *
     * @since 1.0.0
     */
    do_action('flowforms_builder_admin_head', $this->view);
  }

  /**
   * Enqueues the builder script and stylesheet and localises flowformsBuilderData.
   *
   * @since 1.0.0
   */
  public function enqueues()
  {
    wp_enqueue_media();

    $asset_file = FLOWFORMS_PATH . 'build/builder/index.asset.php';
    $asset = file_exists($asset_file)
      ? include $asset_file
      : ['dependencies' => [], 'version' => FLOWFORMS_VERSION];

    wp_enqueue_script(
      'flowforms-builder',
      FLOWFORMS_URL . 'build/builder/index.js',
      $asset['dependencies'],
      $asset['version'],
      true
    );

    wp_set_script_translations( 'flowforms-builder', 'flowforms', FLOWFORMS_PATH . 'languages' );

    wp_enqueue_style(
      'flowforms-builder',
      FLOWFORMS_URL . 'build/builder/style-index.css',
      [],
      $asset['version']
    );

    wp_add_inline_style( 'flowforms-builder', '
      #adminmenumain { display: none !important }

      #wpff-page-loader {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F5F3EE;
      }

      #wpff-page-loader.wpff-page-loader--leaving {
        animation: wpff-loader-fade-up-out 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        pointer-events: none;
      }

      @keyframes wpff-loader-fade-up-out {
        0%   { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes wpff-spin {
        to { transform: rotate(360deg); }
      }

      #wpff-page-loader .wpff-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }

      #wpff-page-loader .wpff-loader-logo img {
        width: auto;
        height: 48px;
      }

      #wpff-page-loader .wpff-loader-spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid #e0e0e0;
        border-top-color: #5B4EE8;
        animation: wpff-spin 0.7s linear infinite;
      }
    ' );

    wp_localize_script('flowforms-builder', 'flowformsBuilderData', [
      'apiUrl'        => rest_url('flowforms/v1'),
      'adminFormsUrl' => admin_url('admin.php?page=flowforms_forms'),
      'builderUrl'    => wp_nonce_url( admin_url('admin.php?page=flowforms_form_builder'), 'flowforms_builder_nav' ),
      'nonce'         => wp_create_nonce('wp_rest'),
      // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation param; form ID is validated by absint() and checked in init().
      'formId'        => intval($_GET['form_id'] ?? 0),
      'view'          => $this->view,
      // phpcs:disable WordPress.Security.NonceVerification.Recommended -- Same read-only navigation param as above.
      'previewUrl'    => intval($_GET['form_id'] ?? 0)
        ? FlowForms_Frontend::get_preview_url(intval($_GET['form_id']))
        : '',
      'publicUrl'     => intval($_GET['form_id'] ?? 0)
        ? FlowForms_Frontend::get_public_url(intval($_GET['form_id']))
        : '',
      // phpcs:enable WordPress.Security.NonceVerification.Recommended
      'templates'     => array_values(flowforms()->obj('templates')->get_metadata()),
      'site'          => [
        'adminEmail' => get_option('admin_email'),
        'siteName'   => get_bloginfo('name'),
      ],
    ]);
  }

  /**
   * Renders the builder mount-point div.
   *
   * @since 1.0.0
   */
  public function output()
  {
    /**
     * Allow developers to disable Form Builder output.
     *
     * @since 1.0.0
     *
     * @param bool $is_enabled Is builder output enabled? Defaults to `true`.
     */
    if (! apply_filters('flowforms_builder_output', true)) {
      return;
    }

    $form_id         = $this->form ? absint($this->form->ID) : '';
?>
    <div id="wpff-builder" data-view="<?php echo esc_attr($this->view); ?>"></div>
<?php
  }
}

FlowForms_Builder::instance();
