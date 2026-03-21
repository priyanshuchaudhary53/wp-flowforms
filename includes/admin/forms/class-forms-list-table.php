<?php

if (! defined('ABSPATH')) exit;

// Required by WP_List_Table.
if (! class_exists('WP_List_Table')) {
  require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * Forms list table for the All Forms overview page.
 *
 * @since 1.0.0
 */
class FlowForms_Forms_List_Table extends WP_List_Table
{
  /**
   * Current view (all | trash).
   *
   * @since 1.0.0
   *
   * @var string
   */
  private string $current_view = 'all';

  /**
   * Count of forms in each view.
   *
   * @since 1.0.0
   *
   * @var array
   */
  private array $view_counts = [];

  /**
   * Number of items per page.
   *
   * @since 1.0.0
   *
   * @var int
   */
  private int $per_page = 20;

  /**
   * Constructor.
   *
   * @since 1.0.0
   */
  public function __construct()
  {
    parent::__construct([
      'singular' => 'form',
      'plural'   => 'forms',
      'ajax'     => false,
    ]);

    // Determine current view.
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    $status             = isset($_GET['status']) ? sanitize_key($_GET['status']) : '';
    $this->current_view = ($status === 'trash') ? 'trash' : 'all';
  }

  /**
   * Define table columns.
   *
   * @since 1.0.0
   *
   * @return array
   */
  public function get_columns(): array
  {
    return [
      'cb'        => '<input type="checkbox">',
      'name'      => __('Name', 'wp-flowforms'),
      'shortcode' => __('Shortcode', 'wp-flowforms'),
      'author'    => __('Author', 'wp-flowforms'),
      'created'   => __('Date', 'wp-flowforms'),
    ];
  }

  /**
   * Sortable columns.
   *
   * @since 1.0.0
   *
   * @return array
   */
  protected function get_sortable_columns(): array
  {
    return [
      'name'    => ['title', false],
      'created' => ['date', false],
    ];
  }

  /**
   * Checkbox column.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form Form post object.
   *
   * @return string
   */
  public function column_cb($form): string
  {
    return sprintf(
      '<input type="checkbox" name="form_id[]" value="%d">',
      absint($form->ID)
    );
  }

  /**
   * Form name column — primary column with row actions.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form Form post object.
   *
   * @return string
   */
  public function column_name($form): string
  {
    $title = ! empty($form->post_title) ? $form->post_title : __('(no title)', 'wp-flowforms');

    // Build the title link.
    if ($this->current_view === 'trash') {
      $name_html = '<strong>' . esc_html($title) . '</strong>';
    } else {
      $edit_url  = add_query_arg(
        ['page' => 'wpff_form_builder', 'form_id' => $form->ID],
        admin_url('admin.php')
      );
      $name_html = sprintf(
        '<a href="%s" class="row-title"><strong>%s</strong></a>',
        esc_url($edit_url),
        esc_html($title)
      );
    }

    // Build row actions.
    $base_url = remove_query_arg(['action', 'action2', '_wpnonce', 'form_id', 'paged', '_wp_http_referer']);

    if ($this->current_view === 'trash') {
      $actions = [
        'restore' => sprintf(
          '<a href="%s">%s</a>',
          esc_url(wp_nonce_url(
            add_query_arg(['action' => 'restore', 'form_id' => $form->ID], $base_url),
            'wpff_restore_form_nonce'
          )),
          esc_html__('Restore', 'wp-flowforms')
        ),
        'delete'  => sprintf(
          '<a href="%s" class="submitdelete" onclick="return confirm(\'%s\')">%s</a>',
          esc_url(wp_nonce_url(
            add_query_arg(['action' => 'delete', 'form_id' => $form->ID], $base_url),
            'wpff_delete_form_nonce'
          )),
          esc_js(__('Are you sure you want to permanently delete this form?', 'wp-flowforms')),
          esc_html__('Delete Permanently', 'wp-flowforms')
        ),
      ];
    } else {
      $actions = [];

      if (current_user_can('manage_options')) {
        $edit_url = add_query_arg(
          ['page' => 'wpff_form_builder', 'form_id' => $form->ID],
          admin_url('admin.php')
        );
        $actions['edit'] = sprintf(
          '<a href="%s">%s</a>',
          esc_url($edit_url),
          esc_html__('Edit', 'wp-flowforms')
        );

        $actions['duplicate'] = sprintf(
          '<a href="%s">%s</a>',
          esc_url(wp_nonce_url(
            add_query_arg(['action' => 'duplicate', 'form_id' => $form->ID], $base_url),
            'wpff_duplicate_form_nonce'
          )),
          esc_html__('Duplicate', 'wp-flowforms')
        );

        $actions['preview'] = sprintf(
          '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
          esc_url(FlowForms_Frontend::get_preview_url($form->ID)),
          esc_html__('Preview', 'wp-flowforms')
        );

        $actions['trash'] = sprintf(
          '<a href="%s" class="submitdelete">%s</a>',
          esc_url(wp_nonce_url(
            add_query_arg(['action' => 'trash', 'form_id' => $form->ID], $base_url),
            'wpff_trash_form_nonce'
          )),
          esc_html__('Trash', 'wp-flowforms')
        );
      }
    }

    /**
     * Filters the row action links on the All Forms page.
     *
     * @since 1.0.0
     *
     * @param array   $actions Row actions.
     * @param WP_Post $form    Form post object.
     */
    $actions = apply_filters('wpff_overview_row_actions', $actions, $form);

    return $name_html . $this->row_actions($actions);
  }

  /**
   * Shortcode column.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form Form post object.
   *
   * @return string
   */
  public function column_shortcode($form): string
  {
    return sprintf(
      '<code>[flowform id="%d"]</code>',
      absint($form->ID)
    );
  }

  /**
   * Author column.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form Form post object.
   *
   * @return string
   */
  public function column_author($form): string
  {
    $user = get_userdata($form->post_author);

    if (! $user) {
      return '—';
    }

    $edit_url = get_edit_user_link($user->ID);

    return $edit_url
      ? sprintf('<a href="%s">%s</a>', esc_url($edit_url), esc_html($user->display_name))
      : esc_html($user->display_name);
  }

  /**
   * Date column — shows created or last-modified date.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form Form post object.
   *
   * @return string
   */
  public function column_created($form): string
  {
    $created  = strtotime($form->post_date);
    $modified = strtotime($form->post_modified);

    // If same day → show "Created on …", else show "Modified …".
    if (gmdate('Ymd', $created) === gmdate('Ymd', $modified)) {
      return sprintf(
        '<span class="wpff-date-label">%s</span><br>%s',
        esc_html__('Created', 'wp-flowforms'),
        esc_html(get_the_date(get_option('date_format'), $form))
      );
    }

    return sprintf(
      '<span class="wpff-date-label">%s</span><br>%s',
      esc_html__('Modified', 'wp-flowforms'),
      esc_html(get_the_modified_date(get_option('date_format'), $form))
    );
  }

  /**
   * Fallback column renderer.
   *
   * @since 1.0.0
   *
   * @param WP_Post $form        Form post object.
   * @param string  $column_name Column slug.
   *
   * @return string
   */
  public function column_default($form, $column_name): string
  {
    /**
     * Filters a custom column value on the All Forms list table.
     *
     * @since 1.0.0
     *
     * @param string  $value       Column value.
     * @param WP_Post $form        Form post object.
     * @param string  $column_name Column slug.
     */
    return apply_filters('wpff_overview_column_value', '', $form, $column_name);
  }

  /**
   * Bulk actions dropdown items.
   *
   * @since 1.0.0
   *
   * @return array
   */
  public function get_bulk_actions(): array
  {
    if ($this->current_view === 'trash') {
      return [
        'restore' => __('Restore', 'wp-flowforms'),
        'delete'  => __('Delete Permanently', 'wp-flowforms'),
      ];
    }

    return [
      'trash'     => __('Move to Trash', 'wp-flowforms'),
      'duplicate' => __('Duplicate', 'wp-flowforms'),
    ];
  }

  /**
   * Build the view tab links.
   *
   * @since 1.0.0
   *
   * @return array
   */
  protected function get_views(): array
  {
    $base_url = admin_url('admin.php?page=wpff_forms');
    $counts   = $this->view_counts;
    $views    = [];

    $all_count   = $counts['all']   ?? 0;
    $trash_count = $counts['trash'] ?? 0;

    $views['all'] = sprintf(
      '<a href="%s"%s>%s <span class="count">(%d)</span></a>',
      esc_url($base_url),
      $this->current_view === 'all' ? ' class="current"' : '',
      esc_html__('All', 'wp-flowforms'),
      $all_count
    );

    if ($trash_count > 0 || $this->current_view === 'trash') {
      $views['trash'] = sprintf(
        '<a href="%s"%s>%s <span class="count">(%d)</span></a>',
        esc_url(add_query_arg('status', 'trash', $base_url)),
        $this->current_view === 'trash' ? ' class="current"' : '',
        esc_html__('Trash', 'wp-flowforms'),
        $trash_count
      );
    }

    return $views;
  }

  /**
   * Fetch forms and set pagination.
   *
   * @since 1.0.0
   */
  public function prepare_items()
  {
    // Column headers.
    $columns               = $this->get_columns();
    $hidden                = [];
    $sortable              = $this->get_sortable_columns();
    $this->_column_headers = [$columns, $hidden, $sortable];

    // Pagination.
    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $page     = $this->get_pagenum();
    $order    = (isset($_GET['order']) && $_GET['order'] === 'asc') ? 'ASC' : 'DESC';
    $orderby  = isset($_GET['orderby']) ? sanitize_key($_GET['orderby']) : 'ID';
    $search   = isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : '';
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    $per_page = $this->get_items_per_page('wpff_forms_per_page', $this->per_page);

    // Map sortable column slugs to WP_Query orderby values.
    $orderby_map = ['title' => 'title', 'date' => 'date', 'ID' => 'ID'];
    $orderby     = $orderby_map[$orderby] ?? 'ID';

    // Base query args.
    $args = [
      'post_type'      => 'wpff_forms',
      'post_status'    => ($this->current_view === 'trash') ? 'trash' : 'publish',
      'orderby'        => $orderby,
      'order'          => $order,
      'posts_per_page' => $per_page,
      'paged'          => $page,
      'no_found_rows'  => false,
    ];

    if (! empty($search)) {
      $args['s'] = $search;
    }

    /**
     * Filters the WP_Query args used to populate the All Forms list table.
     *
     * @since 1.0.0
     *
     * @param array $args WP_Query arguments.
     */
    $args  = (array) apply_filters('wpff_overview_table_query_args', $args);
    $query = new WP_Query($args);

    $this->items = $query->posts;

    // Count for pagination.
    $this->view_counts = $this->get_view_counts();
    $total_items       = $this->view_counts[$this->current_view] ?? $query->found_posts;

    $this->set_pagination_args([
      'total_items' => $total_items,
      'per_page'    => $per_page,
      'total_pages' => (int) ceil($total_items / $per_page),
    ]);
  }

  /**
   * Count forms of any status (publish + trash + draft etc).
   * Used by the overview to decide whether to show the empty state.
   *
   * @since 1.0.0
   *
   * @return int
   */
  public function get_total_forms_count(): int
  {
    $counts = wp_count_posts('wpff_forms');

    $total = 0;
    foreach ((array) $counts as $count) {
      $total += (int) $count;
    }

    return $total;
  }

  /**
   * Run lightweight count queries for each view tab.
   *
   * @since 1.0.0
   *
   * @return array
   */
  private function get_view_counts(): array
  {
    $count_args = [
      'post_type'              => 'wpff_forms',
      'nopaging'               => true,
      'no_found_rows'          => true,
      'update_post_meta_cache' => false,
      'update_post_term_cache' => false,
      'fields'                 => 'ids',
    ];

    $count_args['post_status'] = 'publish';
    $all                       = count((array) get_posts($count_args));

    $count_args['post_status'] = 'trash';
    $trash                     = count((array) get_posts($count_args));

    return [
      'all'   => $all,
      'trash' => $trash,
    ];
  }

  /**
   * Message shown when no forms match the current view / search.
   *
   * @since 1.0.0
   */
  public function no_items()
  {
    if ($this->current_view === 'trash') {
      esc_html_e('No forms found in Trash.', 'wp-flowforms');
    } else {
      esc_html_e('No forms found.', 'wp-flowforms');
    }
  }

  /**
   * Extra controls rendered between bulk actions and pagination.
   * Used here to output the "Empty Trash" button when in trash view.
   *
   * @since 1.0.0
   *
   * @param string $which 'top' or 'bottom'.
   */
  protected function extra_tablenav($which)
  {
    if ($which !== 'top' || $this->current_view !== 'trash' || empty($this->items)) {
      return;
    }

    if (! current_user_can('manage_options')) {
      return;
    }

    $base_url = remove_query_arg(['action', '_wpnonce', 'form_id']);
    $url      = wp_nonce_url(
      add_query_arg(['action' => 'delete', 'form_id' => array_map('absint', wp_list_pluck($this->items, 'ID'))], $base_url),
      'wpff_delete_form_nonce'
    );

    printf(
      '<a href="%s" class="button wpff-empty-trash" onclick="return confirm(\'%s\')">%s</a>',
      esc_url($url),
      esc_js(__('Are you sure you want to permanently delete all forms in Trash?', 'wp-flowforms')),
      esc_html__('Empty Trash', 'wp-flowforms')
    );
  }
}
