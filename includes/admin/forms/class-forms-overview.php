<?php

if (! defined('ABSPATH')) exit;

/**
 * All Forms overview page.
 *
 * Renders the list table at wp-admin/admin.php?page=wpff_forms.
 *
 * @since 1.0.0
 */
class FlowForms_Forms_Overview
{
  /**
   * List table instance.
   *
   * @since 1.0.0
   *
   * @var FlowForms_Forms_List_Table
   */
  private $list_table;

  /**
   * Number of forms per page (default).
   *
   * @since 1.0.0
   */
  const PER_PAGE_DEFAULT = 20;

  /**
   * Constructor.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    add_action('admin_init', [$this, 'init']);
  }

  /**
   * Initialize — only runs on the overview page.
   *
   * @since 1.0.0
   */
  public function init()
  {
    if (! wpff_is_admin_page('forms')) {
      return;
    }

    // Register the "Number of forms per page" screen option.
    add_action('load-toplevel_page_wpff_forms', [$this, 'register_screen_options']);

    // Process bulk / single-row actions before any output.
    $this->process_actions();

    add_action('current_screen',        [$this, 'init_list_table']);
    add_action('admin_enqueue_scripts', [$this, 'enqueues']);
    add_action('wpff_admin_page',        [$this, 'output']);
  }

  /**
   * Register screen options for the overview page.
   *
   * @since 1.0.0
   */
  public function register_screen_options()
  {
    add_screen_option('per_page', [
      'label'   => __('Number of forms per page', 'wp-flowforms'),
      'default' => self::PER_PAGE_DEFAULT,
      'option'  => 'wpff_forms_per_page',
    ]);

    // Allow WP to save our custom screen option key.
    add_filter('set_screen_option_wpff_forms_per_page', [$this, 'save_screen_option'], 10, 3);
  }

  /**
   * Whitelist and sanitize the per-page screen option value when saved.
   *
   * Without this filter WP silently discards the value.
   *
   * @since 1.0.0
   *
   * @param mixed  $status Existing value (false to reject).
   * @param string $option Option name.
   * @param mixed  $value  Submitted value.
   *
   * @return int
   */
  public function save_screen_option($status, $option, $value): int
  {
    return (int) $value;
  }

  /**
   * Instantiate the list table (needs current_screen to be set).
   *
   * @since 1.0.0
   */
  public function init_list_table()
  {
    require_once WP_FLOWFORMS_PATH . 'includes/admin/forms/class-forms-list-table.php';
    $this->list_table = new FlowForms_Forms_List_Table();
  }

  /**
   * Enqueue overview-page assets.
   *
   * @since 1.0.0
   */
  public function enqueues()
  {
    wp_enqueue_style(
      'wp-flowforms-overview',
      WP_FLOWFORMS_URL . 'assets/css/admin-forms-overview.css',
      [],
      WP_FLOWFORMS_VERSION
    );
  }

  /**
   * Process single-row and bulk actions before output.
   *
   * @since 1.0.0
   */
  private function process_actions()
  {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $action = isset($_REQUEST['action']) ? sanitize_key($_REQUEST['action']) : '';

    // WP_List_Table uses action2 for the bottom bulk selector.
    if ($action === '-1' && ! empty($_REQUEST['action2'])) {
      $action = sanitize_key($_REQUEST['action2']);
    }
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    $allowed = ['trash', 'restore', 'delete', 'duplicate'];

    if (! in_array($action, $allowed, true)) {
      return;
    }

    // Collect form IDs (single row passes form_id as scalar, bulk as array).
    $raw_ids = isset($_REQUEST['form_id']) ? (array) $_REQUEST['form_id'] : []; // phpcs:ignore
    $ids     = array_map('absint', $raw_ids);

    if (empty($ids)) {
      return;
    }

    // Verify nonce — accept either the bulk nonce or action-specific nonce.
    $nonce = isset($_REQUEST['_wpnonce']) ? sanitize_key($_REQUEST['_wpnonce']) : ''; // phpcs:ignore
    if (
      ! wp_verify_nonce($nonce, 'bulk-forms') &&
      ! wp_verify_nonce($nonce, 'wpff_' . $action . '_form_nonce')
    ) {
      wp_die(esc_html__('Security check failed.', 'wp-flowforms'), 403);
    }

    $count  = 0;
    $method = 'action_' . $action;

    foreach ($ids as $id) {
      if (method_exists($this, $method) && $this->$method($id)) {
        $count++;
      }
    }

    // Redirect back, appending the result count so we can show a notice.
    $redirect_arg = rtrim($action, 'e') . 'ed'; // trash→trashed, restore→restored, etc.
    wp_safe_redirect(
      add_query_arg(
        [$redirect_arg => $count],
        remove_query_arg(['action', 'action2', '_wpnonce', 'form_id', 'paged', '_wp_http_referer'])
      )
    );
    exit;
  }

  /** Move a form to trash. */
  private function action_trash(int $id): bool
  {
    if (! current_user_can('manage_options')) {
      return false;
    }

    return (bool) wp_trash_post($id);
  }

  /** Restore a form from trash. */
  private function action_restore(int $id): bool
  {
    if (! current_user_can('manage_options')) {
      return false;
    }

    // WP 5.6+ changed wp_untrash_post() to restore to 'draft' by default.
    // Force wpff_forms back to 'publish' regardless of the stored pre-trash status.
    add_filter('wp_untrash_post_status', function ($status, $post_id, $previous_status) use ($id) {
      if ((int) $post_id === $id && get_post_type($post_id) === 'wpff_forms') {
        return 'publish';
      }
      return $status;
    }, 10, 3);

    return (bool) wp_untrash_post($id);
  }

  /** Permanently delete a form. */
  private function action_delete(int $id): bool
  {
    if (! current_user_can('manage_options')) {
      return false;
    }

    return (bool) wp_delete_post($id, true);
  }

  /** Duplicate a form. */
  private function action_duplicate(int $id): bool
  {
    if (! current_user_can('manage_options')) {
      return false;
    }

    $post = get_post($id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return false;
    }

    $new_id = wp_insert_post([
      'post_title'   => $post->post_title . ' ' . __('(Copy)', 'wp-flowforms'),
      'post_content' => $post->post_content,
      'post_status'  => 'publish',
      'post_type'    => 'wpff_forms',
      'post_author'  => get_current_user_id(),
    ]);

    return ! is_wp_error($new_id) && $new_id > 0;
  }

  /**
   * Render the full overview page.
   *
   * @since 1.0.0
   */
  public function output()
  {
    // Show admin notices for completed actions.
    $this->render_action_notices();

    // Prepare items before we check empty state.
    $this->list_table->prepare_items();

    $is_empty = empty($this->list_table->items)
      && empty($_GET['s'])
      && empty($_GET['status'])
      && $this->list_table->get_total_forms_count() === 0;

?>
    <div class="wrap wpff-admin-wrap">

      <h1 class="wp-heading-inline">
        <?php esc_html_e('All Forms', 'wp-flowforms'); ?>
      </h1>

      <?php if (current_user_can('manage_options')) : ?>
        <a href="<?php echo esc_url(admin_url('admin.php?page=wpff_form_builder')); ?>"
          class="page-title-action wpff-add-new-btn">
          <?php esc_html_e('Add New Form', 'wp-flowforms'); ?>
        </a>
      <?php endif; ?>

      <hr class="wp-header-end">

      <?php if ($is_empty) : ?>

        <?php $this->render_empty_state(); ?>

      <?php else : ?>

        <div class="wpff-overview-content">
          <form id="wpff-forms-table" method="get"
            action="<?php echo esc_url(admin_url('admin.php?page=wpff_forms')); ?>">

            <input type="hidden" name="page" value="wpff_forms">

            <?php
            $this->list_table->search_box(esc_html__('Search Forms', 'wp-flowforms'), 'wpff-search');
            $this->list_table->views();
            $this->list_table->display();
            ?>

          </form>
        </div>

      <?php endif; ?>

    </div>
  <?php
  }

  /**
   * Render action result notices (trashed, restored, deleted, duplicated).
   *
   * @since 1.0.0
   */
  private function render_action_notices()
  {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $messages = [
      'trashed'    => [
        'singular' => __('Form moved to Trash.', 'wp-flowforms'),
        'plural'   => __('%d forms moved to Trash.', 'wp-flowforms'),
      ],
      'restored'   => [
        'singular' => __('Form restored from Trash.', 'wp-flowforms'),
        'plural'   => __('%d forms restored from Trash.', 'wp-flowforms'),
      ],
      'deleted'    => [
        'singular' => __('Form permanently deleted.', 'wp-flowforms'),
        'plural'   => __('%d forms permanently deleted.', 'wp-flowforms'),
      ],
      'duplicated' => [
        'singular' => __('Form duplicated.', 'wp-flowforms'),
        'plural'   => __('%d forms duplicated.', 'wp-flowforms'),
      ],
    ];

    foreach ($messages as $key => $text) {
      if (empty($_REQUEST[$key])) {
        continue;
      }

      $count = (int) $_REQUEST[$key];
      $msg   = $count === 1 ? $text['singular'] : sprintf($text['plural'], $count);

      printf(
        '<div class="notice notice-success is-dismissible"><p>%s</p></div>',
        esc_html($msg)
      );
    }
    // phpcs:enable WordPress.Security.NonceVerification.Recommended
  }

  /**
   * Render the empty state when no forms exist.
   *
   * @since 1.0.0
   */
  private function render_empty_state()
  {
  ?>
    <div class="wpff-empty-state">
      <div class="wpff-empty-state__icon">
        <span class="dashicons dashicons-feedback"></span>
      </div>
      <h2 class="wpff-empty-state__title">
        <?php esc_html_e("You haven't created any forms yet.", 'wp-flowforms'); ?>
      </h2>
      <p class="wpff-empty-state__desc">
        <?php esc_html_e('Create your first form to start collecting responses.', 'wp-flowforms'); ?>
      </p>
      <?php if (current_user_can('manage_options')) : ?>
        <a href="<?php echo esc_url(admin_url('admin.php?page=wpff_form_builder')); ?>"
          class="button button-primary button-hero wpff-add-new-btn">
          <?php esc_html_e('Create Your First Form', 'wp-flowforms'); ?>
        </a>
      <?php endif; ?>
    </div>
<?php
  }
}

new FlowForms_Forms_Overview();
