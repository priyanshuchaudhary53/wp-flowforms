<?php

if (! defined('ABSPATH')) exit;

/**
 * FlowForms_Entries_Overview
 *
 * Controller for wp-admin/admin.php?page=flowforms_entries.
 * Handles the list view, single entry view, bulk actions and CSV export.
 *
 * @since 1.0.0
 */
class FlowForms_Entries_Overview
{
  /**
   * Entries per page default.
   */
  const PER_PAGE_DEFAULT = 20;

  /**
   * List table instance.
   *
   * @var FlowForms_Entries_List_Table
   */
  private $list_table;

  /**
   * Current view: 'list' | 'single'.
   *
   * @var string
   */
  private string $view = 'list';

  /**
   * Active form filter (0 = all forms).
   *
   * @var int
   */
  private int $form_id = 0;

  /**
   * Active status tab: 'active' | 'starred' | 'spam' | 'trash'.
   *
   * @var string
   */
  private string $status = 'active';

  /**
   * Registers AJAX handlers and hooks admin_init to initialise the entries page.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    // AJAX handlers must be registered in the constructor — page guards in init() would block them.
    add_action('wp_ajax_flowforms_toggle_star', [$this, 'ajax_toggle_star']);

    add_filter('set-screen-option', [$this, 'set_screen_option'], 10, 3);

    add_action('admin_init', [$this, 'init']);
  }

  /**
   * Initialises view state and hooks; bails if not on the entries page.
   *
   * @since 1.0.0
   */
  public function init()
  {
    if (! flowforms_is_admin_page('entries')) {
      return;
    }

    if (! current_user_can('manage_options')) {
      return;
    }

    $nonce       = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
    $nonce_valid = wp_verify_nonce( $nonce, 'flowforms_entries_nav' );

    $this->view    = $nonce_valid && isset( $_GET['view'] ) && $_GET['view'] === 'single' ? 'single' : 'list';
    $this->form_id = $nonce_valid && isset( $_GET['form_id'] ) ? absint( $_GET['form_id'] ) : 0;
    $status        = $nonce_valid && isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : 'active';
    $this->status  = in_array( $status, ['active', 'starred', 'spam', 'trash'], true ) ? $status : 'active';

    $this->process_actions();

    add_action('load-flowforms_page_flowforms_entries', [$this, 'register_screen_options']);
    add_action('current_screen', [$this, 'init_list_table']);
    add_action('admin_enqueue_scripts', [$this, 'enqueues']);
    add_action('flowforms_admin_page', [$this, 'output']);
  }

  /**
   * Registers the entries-per-page screen option on the list view.
   *
   * @since 1.0.0
   */
  public function register_screen_options()
  {
    if ($this->view !== 'list') {
      return;
    }

    add_screen_option('per_page', [
      'label'   => __('Number of entries per page', 'flowforms'),
      'default' => self::PER_PAGE_DEFAULT,
      'option'  => 'flowforms_entries_per_page',
    ]);
  }

  /**
   * Persists the entries-per-page screen option value when saved.
   *
   * @since 1.0.0
   */
  public function set_screen_option($status, $option, $value)
  {
    if ($option === 'flowforms_entries_per_page') {
      return (int) $value;
    }

    return $status;
  }

  /**
   * Instantiates the entries list table once current_screen is available.
   *
   * @since 1.0.0
   */
  public function init_list_table()
  {
    if ($this->view !== 'list') {
      return;
    }

    require_once FLOWFORMS_PATH . 'includes/admin/entries/class-entries-list-table.php';
    $this->list_table = new FlowForms_Entries_List_Table($this->form_id, $this->status);
  }

  /**
   * Enqueues CSS and JS assets for the entries admin page.
   *
   * @since 1.0.0
   */
  public function enqueues()
  {
    wp_enqueue_style(
      'flowforms-entries',
      FLOWFORMS_URL . 'assets/css/admin-entries.css',
      [],
      FLOWFORMS_VERSION
    );

    wp_enqueue_script(
      'flowforms-entries',
      FLOWFORMS_URL . 'assets/js/admin-entries.js',
      ['jquery'],
      FLOWFORMS_VERSION,
      true
    );

    wp_localize_script('flowforms-entries', 'flowformsEntries', [
      'nonce'       => wp_create_nonce('flowforms_entries_nonce'),
      'ajaxUrl'     => admin_url('admin-ajax.php'),
      'starLabel'   => __('Star', 'flowforms'),
      'unstarLabel' => __('Unstar', 'flowforms'),
    ]);
  }

  /**
   * Processes bulk and single-row entry actions before any output is sent.
   *
   * @since 1.0.0
   */
  private function process_actions()
  {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $action = isset($_REQUEST['action']) ? sanitize_key($_REQUEST['action']) : '';
    if ($action === '-1' && ! empty($_REQUEST['action2'])) {
      $action = sanitize_key($_REQUEST['action2']);
    }
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    $allowed = ['trash', 'restore', 'delete', 'spam', 'unspam', 'mark_read', 'mark_unread', 'star', 'unstar', 'empty_trash', 'empty_spam'];

    if (! in_array($action, $allowed, true)) {
      return;
    }

    $nonce = isset($_REQUEST['_wpnonce']) ? sanitize_key($_REQUEST['_wpnonce']) : ''; // phpcs:ignore
    if (
      ! wp_verify_nonce($nonce, 'bulk-entries') &&
      ! wp_verify_nonce($nonce, 'flowforms_entry_' . $action)
    ) {
      wp_die(esc_html__('Security check failed.', 'flowforms'), 403);
    }

    if (! current_user_can('manage_options')) {
      wp_die(esc_html__('You do not have permission to manage entries.', 'flowforms'), 403);
    }

    $entry  = flowforms()->obj('entry');
    $ids    = isset($_REQUEST['entry_id']) ? array_map('absint', (array) $_REQUEST['entry_id']) : []; // phpcs:ignore
    $ids    = array_filter($ids);
    $count  = count($ids);

    switch ($action) {
      case 'trash':
        $entry->update_status($ids, 'trash');
        break;
      case 'restore':
        $entry->update_status($ids, 'active');
        break;
      case 'delete':
        $count = $entry->delete($ids);
        break;
      case 'spam':
        $entry->update_status($ids, 'spam');
        break;
      case 'unspam':
        $entry->update_status($ids, 'active');
        break;
      case 'mark_read':
        $entry->mark_read($ids);
        break;
      case 'mark_unread':
        $entry->mark_unread($ids);
        break;
      case 'star':
        $entry->star($ids);
        break;
      case 'unstar':
        $entry->unstar($ids);
        break;
      case 'empty_trash':
        $count = $entry->delete_by_status('trash', $this->form_id);
        break;
      case 'empty_spam':
        $count = $entry->delete_by_status('spam', $this->form_id);
        break;
    }

    $redirect_arg = $this->action_to_result_key($action);

    $strip    = ['action', 'action2', '_wpnonce', 'paged', '_wp_http_referer'];
    $base_url = remove_query_arg($strip);

    if ($this->view === 'single' && in_array($action, ['spam', 'unspam'], true)) {
      // Reload same entry — button state comes from $entry->status (DB), not URL.
      $base_url = add_query_arg(
        ['page' => 'flowforms_entries', 'view' => 'single', 'entry_id' => $ids[0] ?? 0],
        admin_url('admin.php')
      );
    } elseif ($this->view === 'single' && in_array($action, ['star', 'unstar', 'mark_read', 'mark_unread'], true)) {
      // Stay on same entry — base_url already has view + entry_id intact.
    } else {
      $base_url = remove_query_arg(['entry_id', 'view', 'status'], $base_url);
    }

    wp_safe_redirect(add_query_arg(
      [$redirect_arg => $count],
      $base_url
    ));
    exit;
  }

  /**
   * Maps an action slug to the URL query key used to show the result notice.
   *
   * @since 1.0.0
   */
  private function action_to_result_key(string $action): string
  {
    $map = [
      'trash'       => 'trashed',
      'restore'     => 'restored',
      'delete'      => 'deleted',
      'empty_trash' => 'deleted',
      'empty_spam'  => 'deleted',
      'spam'        => 'spammed',
      'unspam'      => 'unspammed',
      'mark_read'   => 'marked_read',
      'mark_unread' => 'marked_unread',
      'star'        => 'starred',
      'unstar'      => 'unstarred',
    ];

    return $map[$action] ?? $action;
  }

  /**
   * Handles the AJAX request to toggle the starred state of an entry.
   *
   * @since 1.0.0
   */
  public function ajax_toggle_star()
  {
    check_ajax_referer('flowforms_entries_nonce', 'nonce');

    if (! current_user_can('manage_options')) {
      wp_send_json_error('Insufficient permissions.', 403);
    }

    $entry_id  = absint($_POST['entry_id'] ?? 0);
    $starred   = (bool) sanitize_text_field( wp_unslash( $_POST['starred'] ?? '' ) );
    $entry_obj = flowforms()->obj('entry');

    if (! $entry_id || ! $entry_obj) {
      wp_send_json_error('Invalid entry.', 400);
    }

    $starred ? $entry_obj->star($entry_id) : $entry_obj->unstar($entry_id);

    wp_send_json_success(['starred' => $starred]);
  }

  /**
   * Dispatches rendering to the list or single entry view.
   *
   * @since 1.0.0
   */
  public function output()
  {
    if ($this->view === 'single') {
      $this->output_single();
    } else {
      $this->output_list();
    }
  }

  /**
   * Renders the paginated entries list table view.
   *
   * @since 1.0.0
   */
  private function output_list()
  {
    $this->render_action_notices();

    $this->list_table->prepare_items();

    $counts      = flowforms()->obj('entry')->get_counts($this->form_id);
    $total_forms = $this->get_form_options();
    $is_empty = $counts['active'] === 0 && $counts['spam'] === 0 && $counts['trash'] === 0 && $counts['starred'] === 0;

?>
    <div class="wrap wpff-admin-wrap wpff-entries-wrap">

      <h1 class="wp-heading-inline"><?php esc_html_e('Entries', 'flowforms'); ?></h1>

      <hr class="wp-header-end">

      <?php if ($is_empty) : ?>
        <?php $this->render_empty_state(); ?>
      <?php else : ?>

        <?php $this->render_filter_bar($total_forms); ?>

        <?php if ($this->form_id) : ?>
          <?php $form_post = get_post($this->form_id); ?>
          <?php if ($form_post) : ?>
            <div class="wpff-active-filter">
              <?php
              printf(
                /* translators: %s form name */
                esc_html__('Viewing: %s', 'flowforms'),
                '<strong>' . esc_html($form_post->post_title) . '</strong>'
              );
              ?>
              &nbsp;<a href="<?php echo esc_url(remove_query_arg('form_id')); ?>" class="wpff-clear-filter">&#x2715; <?php esc_html_e('Clear', 'flowforms'); ?></a>
            </div>
          <?php endif; ?>
        <?php endif; ?>

        <form id="wpff-entries-table" method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>">
          <input type="hidden" name="page" value="flowforms_entries">
          <?php wp_nonce_field( 'flowforms_entries_nav', '_wpnonce', false ); ?>
          <?php if ($this->form_id) : ?>
            <input type="hidden" name="form_id" value="<?php echo esc_attr($this->form_id); ?>">
          <?php endif; ?>
          <?php if ($this->status !== 'active') : ?>
            <input type="hidden" name="status" value="<?php echo esc_attr($this->status); ?>">
          <?php endif; ?>

          <?php
          $this->list_table->search_box(esc_html__('Search Entries', 'flowforms'), 'wpff-entries-search');
          $this->list_table->views();
          $this->list_table->display();
          ?>

        </form>

      <?php endif; ?>

    </div>
  <?php
  }

  /**
   * Renders the single entry detail view with field answers and navigation.
   *
   * @since 1.0.0
   */
  private function output_single()
  {
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $entry_id = absint($_GET['entry_id'] ?? 0);

    if (! $entry_id) {
      $this->render_not_found();
      return;
    }

    $entry_obj = flowforms()->obj('entry');
    $entry     = $entry_obj->get($entry_id);

    if (! $entry) {
      $this->render_not_found();
      return;
    }

    // Mark as read on open.
    if (! $entry->is_read) {
      $entry_obj->mark_read($entry_id);
      $entry->is_read = true;
    }

    // Use the entry's actual DB status so navigation stays within the correct set.
    $entry_status = $entry->status;
    $adjacent = $entry_obj->get_adjacent_ids($entry_id, [
      'form_id'    => $this->form_id,
      'status'     => $entry_status,
      'is_starred' => $this->status === 'starred' ? true : null,
    ]);

    // Always prefer published for entry display; fall back to draft for
    // forms that have never been published (edge case).
    $form_post    = get_post($entry->form_id);
    $questions    = [];
    if ($form_post) {
      $data      = flowforms_decode($form_post->post_content);
      $slots     = $data['content'] ?? [];
      $content   = $slots['published'] ?? $slots['draft'] ?? [];
      $questions = $content['questions'] ?? [];
    }

    $back_url   = remove_query_arg(['view', 'entry_id']);
    $trash_url  = wp_nonce_url(
      add_query_arg(['action' => 'trash', 'entry_id' => $entry_id], remove_query_arg(['view', 'entry_id'])),
      'flowforms_entry_trash'
    );
    $spam_url   = wp_nonce_url(
      add_query_arg(['action' => 'spam', 'entry_id' => $entry_id]),
      'flowforms_entry_spam'
    );
    $unspam_url = wp_nonce_url(
      add_query_arg(['action' => 'unspam', 'entry_id' => $entry_id]),
      'flowforms_entry_unspam'
    );
    $star_url   = wp_nonce_url(
      add_query_arg(['action' => $entry->is_starred ? 'unstar' : 'star', 'entry_id' => $entry_id]),
      'flowforms_entry_' . ($entry->is_starred ? 'unstar' : 'star')
    );

    $single_base = admin_url('admin.php?page=flowforms_entries&view=single');

    $prev_url = $adjacent['prev']
      ? wp_nonce_url( add_query_arg('entry_id', $adjacent['prev'], $single_base), 'flowforms_entries_nav' )
      : null;
    $next_url = $adjacent['next']
      ? wp_nonce_url( add_query_arg('entry_id', $adjacent['next'], $single_base), 'flowforms_entries_nav' )
      : null;

  ?>
    <div class="wrap wpff-admin-wrap wpff-entry-single">

      <div class="wpff-entry-single__header">
        <a href="<?php echo esc_url($back_url); ?>" class="wpff-entry-back">
          &larr; <?php esc_html_e('Back to Entries', 'flowforms'); ?>
        </a>

        <h1 class="wp-heading-inline">
          <?php
          echo esc_html( sprintf(
            /* translators: %d entry ID */
            __('Entry #%d', 'flowforms'),
            absint( $entry->id )
          ) );
          ?>
        </h1>

        <div class="wpff-entry-single__actions">
          <a href="<?php echo esc_url($star_url); ?>"
            class="button wpff-star-btn <?php echo $entry->is_starred ? 'wpff-starred' : ''; ?>"
            title="<?php echo $entry->is_starred ? esc_attr__('Unstar', 'flowforms') : esc_attr__('Star', 'flowforms'); ?>">
            <?php echo $entry->is_starred ? '&#9733;' : '&#9734;'; ?>
            <?php echo $entry->is_starred ? esc_html__('Starred', 'flowforms') : esc_html__('Star', 'flowforms'); ?>
          </a>
          <?php if ($entry->status === 'spam') : ?>
            <a href="<?php echo esc_url($unspam_url); ?>" class="button">
              <?php esc_html_e('Not Spam', 'flowforms'); ?>
            </a>
          <?php elseif ($entry->status !== 'trash') : ?>
            <a href="<?php echo esc_url($spam_url); ?>" class="button wpff-spam-btn">
              <?php esc_html_e('Mark as Spam', 'flowforms'); ?>
            </a>
            <a href="<?php echo esc_url($trash_url); ?>" class="button wpff-trash-btn">
              <?php esc_html_e('Move to Trash', 'flowforms'); ?>
            </a>
          <?php endif; ?>
        </div>
      </div>

      <hr class="wp-header-end">

      <div class="wpff-entry-single__meta">
        <span>
          <strong><?php esc_html_e('Submitted:', 'flowforms'); ?></strong>
          <?php echo esc_html(wp_date(get_option('date_format') . ' ' . get_option('time_format'), strtotime($entry->created_at))); ?>
        </span>
        <?php if ($form_post) : ?>
          <span>
            <strong><?php esc_html_e('Form:', 'flowforms'); ?></strong>
            <a href="<?php echo esc_url( wp_nonce_url( add_query_arg(['page' => 'flowforms_entries', 'form_id' => $form_post->ID], admin_url('admin.php')), 'flowforms_entries_nav' ) ); ?>">
              <?php echo esc_html($form_post->post_title); ?>
            </a>
          </span>
        <?php endif; ?>
        <?php if (! empty($entry->ip_address)) : ?>
          <span>
            <strong><?php esc_html_e('IP:', 'flowforms'); ?></strong>
            <?php echo esc_html($entry->ip_address); ?>
          </span>
        <?php endif; ?>
      </div>

      <div class="wpff-entry-single__fields">
        <?php if (! empty($questions)) : ?>
          <?php foreach ($questions as $q) :
            $q_id    = $q['id'] ?? '';
            $label   = $q['content']['title'] ?? $q['content']['label'] ?? $q['content']['question'] ?? $q_id;
            $answer  = $entry->answers[$q_id] ?? null;
            $empty   = is_null($answer) || $answer === '' || $answer === [];
          ?>
            <div class="wpff-entry-field <?php echo $empty ? 'wpff-entry-field--empty' : ''; ?>">
              <dt class="wpff-entry-field__label">
                <?php echo wp_kses( FlowForms_Field_Icons::label_with_icon($q['type'] ?? '', $label), flowforms_kses_field_icon() ); ?>
              </dt>
              <dd class="wpff-entry-field__value">
                <?php if ($empty) : ?>
                  <span class="wpff-no-answer"><?php esc_html_e('—', 'flowforms'); ?></span>
                <?php else : ?>
                  <?php echo wp_kses_post($this->format_answer($answer, $q['type'] ?? 'short_text')); ?>
                <?php endif; ?>
              </dd>
            </div>
          <?php endforeach; ?>
        <?php else : ?>
          <?php foreach ($entry->answers as $key => $value) : ?>
            <div class="wpff-entry-field">
              <dt class="wpff-entry-field__label">
                <?php echo wp_kses( FlowForms_Field_Icons::label_with_icon('', $key), flowforms_kses_field_icon() ); ?>
              </dt>
              <dd class="wpff-entry-field__value">
                <?php echo wp_kses_post($this->format_answer($value, 'short_text')); ?>
              </dd>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>

      <div class="wpff-entry-single__nav">
        <?php if ($prev_url) : ?>
          <a href="<?php echo esc_url($prev_url); ?>" class="button">&larr; <?php esc_html_e('Previous', 'flowforms'); ?></a>
        <?php else : ?>
          <button class="button" disabled>&larr; <?php esc_html_e('Previous', 'flowforms'); ?></button>
        <?php endif; ?>

        <?php if ($next_url) : ?>
          <a href="<?php echo esc_url($next_url); ?>" class="button"><?php esc_html_e('Next', 'flowforms'); ?> &rarr;</a>
        <?php else : ?>
          <button class="button" disabled><?php esc_html_e('Next', 'flowforms'); ?> &rarr;</button>
        <?php endif; ?>
      </div>

    </div>
  <?php
  }

  /**
   * Formats a raw answer value as safe HTML for display.
   *
   * @param mixed  $answer
   * @param string $type
   * @return string
   */
  private function format_answer($answer, string $type): string
  {
    if (is_array($answer)) {
      return implode('<br>', array_map('esc_html', $answer));
    }

    if ($type === 'long_text') {
      return nl2br(esc_html((string) $answer));
    }

    return esc_html((string) $answer);
  }

  /**
   * Renders the form and date filter dropdowns above the entries table.
   *
   * Uses its own standalone <form> so it only submits the params it owns,
   * keeping the URL clean and not mixing with list table hidden fields.
   *
   * @since 1.0.0
   *
   * @param array $form_options
   */
  private function render_filter_bar(array $form_options)
  {
    $current_date = isset($_GET['date']) ? sanitize_key($_GET['date']) : ''; // phpcs:ignore
    $current_s    = isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : ''; // phpcs:ignore

    $date_options = [
      ''          => __('Any date', 'flowforms'),
      'today'     => __('Today', 'flowforms'),
      'yesterday' => __('Yesterday', 'flowforms'),
      '7days'     => __('Last 7 days', 'flowforms'),
      '30days'    => __('Last 30 days', 'flowforms'),
      'month'     => __('This month', 'flowforms'),
    ];

  ?>
    <form id="wpff-filter-bar" method="get" action="<?php echo esc_url(admin_url('admin.php')); ?>">
      <input type="hidden" name="page" value="flowforms_entries">
      <?php wp_nonce_field( 'flowforms_entries_nav', '_wpnonce', false ); ?>
      <?php if ($this->status !== 'active') : ?>
        <input type="hidden" name="status" value="<?php echo esc_attr($this->status); ?>">
      <?php endif; ?>
      <?php if (! empty($current_s)) : ?>
        <input type="hidden" name="s" value="<?php echo esc_attr($current_s); ?>">
      <?php endif; ?>

      <div class="wpff-filter-bar">
        <div class="wpff-filter-bar__group">
          <label for="wpff-form-filter" class="screen-reader-text">
            <?php esc_html_e('Filter by form', 'flowforms'); ?>
          </label>
          <select id="wpff-form-filter" name="form_id" onchange="this.form.submit()">
            <option value=""><?php esc_html_e('All Forms', 'flowforms'); ?></option>
            <?php foreach ($form_options as $opt) : ?>
              <option value="<?php echo esc_attr($opt['value']); ?>"
                <?php selected($this->form_id, $opt['value']); ?>>
                <?php echo esc_html($opt['label']); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <div class="wpff-filter-bar__group">
          <label for="wpff-date-filter" class="screen-reader-text">
            <?php esc_html_e('Filter by date', 'flowforms'); ?>
          </label>
          <select id="wpff-date-filter" name="date" onchange="this.form.submit()">
            <?php foreach ($date_options as $val => $label) : ?>
              <option value="<?php echo esc_attr($val); ?>"
                <?php selected($current_date, $val); ?>>
                <?php echo esc_html($label); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>
    </form>
  <?php
  }

  /**
   * Renders admin notice banners for completed bulk or single-row actions.
   *
   * @since 1.0.0
   */
  private function render_action_notices()
  {
    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $messages = [
      /* translators: %d: number of entries */
      'trashed'      => __('%d entry moved to Trash.', 'flowforms'),
      /* translators: %d: number of entries */
      'restored'     => __('%d entry restored.', 'flowforms'),
      /* translators: %d: number of entries */
      'deleted'      => __('%d entry permanently deleted.', 'flowforms'),
      /* translators: %d: number of entries */
      'spammed'      => __('%d entry marked as spam.', 'flowforms'),
      /* translators: %d: number of entries */
      'unspammed'    => __('%d entry restored from spam.', 'flowforms'),
      /* translators: %d: number of entries */
      'marked_read'  => __('%d entry marked as read.', 'flowforms'),
      /* translators: %d: number of entries */
      'marked_unread' => __('%d entry marked as unread.', 'flowforms'),
      /* translators: %d: number of entries */
      'starred'      => __('%d entry starred.', 'flowforms'),
      /* translators: %d: number of entries */
      'unstarred'    => __('%d entry unstarred.', 'flowforms'),
    ];

    foreach ($messages as $key => $template) {
      if (empty($_REQUEST[$key])) {
        continue;
      }
      $count = (int) $_REQUEST[$key];
      printf(
        '<div class="notice notice-success is-dismissible"><p>%s</p></div>',
        esc_html(sprintf($template, $count))
      );
    }
    // phpcs:enable WordPress.Security.NonceVerification.Recommended
  }

  /**
   * Renders the empty state message when no entries exist for the form.
   *
   * @since 1.0.0
   */
  private function render_empty_state()
  {
    $form_post = $this->form_id ? get_post($this->form_id) : null;
  ?>
    <?php if ($form_post) : ?>
      <div class="wpff-active-filter">
        <?php
        printf(
          /* translators: %s form name */
          esc_html__('Viewing: %s', 'flowforms'),
          '<strong>' . esc_html($form_post->post_title) . '</strong>'
        );
        ?>
        &nbsp;<a href="<?php echo esc_url(remove_query_arg('form_id')); ?>" class="wpff-clear-filter">&#x2715; <?php esc_html_e('Clear', 'flowforms'); ?></a>
      </div>
    <?php endif; ?>

    <div class="wpff-empty-state">
      <div class="wpff-empty-state__icon">
        <span class="dashicons dashicons-feedback"></span>
      </div>
      <h2 class="wpff-empty-state__title">
        <?php if ($form_post) : ?>
          <?php
          printf(
            /* translators: %s: form name */
            esc_html__('No entries yet for %s.', 'flowforms'),
            esc_html($form_post->post_title)
          );
          ?>
        <?php else : ?>
          <?php esc_html_e('No entries yet.', 'flowforms'); ?>
        <?php endif; ?>
      </h2>
      <p class="wpff-empty-state__desc">
        <?php esc_html_e('Share your form to start collecting responses.', 'flowforms'); ?>
      </p>
      <?php if ($form_post) : ?>
        <div class="wpff-empty-state__actions">
          <a href="<?php echo esc_url( wp_nonce_url( add_query_arg(['page' => 'flowforms_form_builder', 'form_id' => $form_post->ID, 'view' => 'share'], admin_url('admin.php')), 'flowforms_builder_nav' ) ); ?>"
            class="button button-primary">
            <?php esc_html_e('Share Form', 'flowforms'); ?>
          </a>
          <a href="<?php echo esc_url(remove_query_arg('form_id')); ?>" class="button">
            <?php esc_html_e('View All Entries', 'flowforms'); ?>
          </a>
        </div>
      <?php endif; ?>
    </div>
  <?php
  }

  /**
   * Renders a not-found message when the requested entry does not exist.
   *
   * @since 1.0.0
   */
  private function render_not_found()
  {
  ?>
    <div class="wrap wpff-admin-wrap">
      <p><?php esc_html_e('Entry not found.', 'flowforms'); ?>
        <a href="<?php echo esc_url(admin_url('admin.php?page=flowforms_entries')); ?>">
          &larr; <?php esc_html_e('Back to Entries', 'flowforms'); ?>
        </a>
      </p>
    </div>
<?php
  }

  /**
   * Builds the list of published forms for the filter dropdown.
   *
   * @since 1.0.0
   *
   * @return array
   */
  private function get_form_options(): array
  {
    $posts = get_posts([
      'post_type'      => 'flowforms_forms',
      'post_status'    => 'publish',
      'posts_per_page' => -1,
      'orderby'        => 'title',
      'order'          => 'ASC',
    ]);

    $options = array_map(fn($p) => ['value' => $p->ID, 'label' => $p->post_title], $posts);

    if ($this->form_id && ! in_array($this->form_id, array_column($options, 'value'), true)) {
      $filtered = get_post($this->form_id);

      if ($filtered && $filtered->post_type === 'flowforms_forms') {
        $suffix = $filtered->post_status === 'trash'
          ? __('(trashed)', 'flowforms')
          : __('(unpublished)', 'flowforms');
        $label  = trim($filtered->post_title) !== '' ? $filtered->post_title : sprintf('#%d', $filtered->ID);
        $options[] = ['value' => $filtered->ID, 'label' => $label . ' ' . $suffix];
      } else {
        $options[] = [
          'value' => $this->form_id,
          /* translators: %d form ID of a deleted form */
          'label' => sprintf(__('Deleted form #%d', 'flowforms'), $this->form_id),
        ];
      }
    }

    return $options;
  }
}

new FlowForms_Entries_Overview();
