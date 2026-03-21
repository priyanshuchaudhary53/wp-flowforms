<?php

if (! defined('ABSPATH')) exit;

if (! class_exists('WP_List_Table')) {
  require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * FlowForms_Entries_List_Table
 *
 * WP_List_Table for the entries overview page.
 *
 * @since 1.1.0
 */
class FlowForms_Entries_List_Table extends WP_List_Table
{
  /** @var int Active form filter (0 = all). */
  private int $form_id;

  /** @var string Active status tab. */
  private string $status;

  /** @var array View counts from the entry handler. */
  private array $counts = [];

  public function __construct(int $form_id = 0, string $status = 'active')
  {
    parent::__construct([
      'singular' => 'entry',
      'plural'   => 'entries',
      'ajax'     => false,
    ]);

    $this->form_id = $form_id;
    $this->status  = $status;
  }

  public function get_columns(): array
  {
    $cols = [
      'cb'        => '<input type="checkbox">',
      'id'        => __('ID', 'wp-flowforms'),
      'star'      => '',
      'status'    => __('Status', 'wp-flowforms'),
      'summary'   => __('Summary', 'wp-flowforms'),
      'submitted' => __('Submitted', 'wp-flowforms'),
      'actions'   => __('Actions', 'wp-flowforms'),
    ];

    // Only show Form column when not filtered to a single form.
    if (! $this->form_id) {
      $cols = wpff_array_insert($cols, ['form' => __('Form', 'wp-flowforms')], 'summary');
    }

    return $cols;
  }

  protected function get_sortable_columns(): array
  {
    return [
      'id'        => ['id', true],
      'submitted' => ['created_at', false],
    ];
  }

  public function column_cb($entry): string
  {
    return sprintf('<input type="checkbox" name="entry_id[]" value="%d">', $entry->id);
  }

  public function column_id($entry): string
  {
    $view_url = add_query_arg([
      'page'     => 'wpff_entries',
      'view'     => 'single',
      'entry_id' => $entry->id,
    ], admin_url('admin.php'));

    return sprintf('<a href="%s">#%d</a>', esc_url($view_url), $entry->id);
  }

  public function column_star($entry): string
  {
    $cls = $entry->is_starred ? 'wpff-star wpff-star--on' : 'wpff-star';
    return sprintf(
      '<button type="button" class="%s" data-entry-id="%d" data-starred="%d" title="%s">&#9733;</button>',
      esc_attr($cls),
      $entry->id,
      (int) $entry->is_starred,
      $entry->is_starred ? esc_attr__('Unstar', 'wp-flowforms') : esc_attr__('Star', 'wp-flowforms')
    );
  }

  public function column_form($entry): string
  {
    $post = get_post($entry->form_id);
    if (! $post) {
      return sprintf('—<br><small>#%d</small>', $entry->form_id);
    }

    $url = add_query_arg(['page' => 'wpff_entries', 'form_id' => $post->ID], admin_url('admin.php'));

    return sprintf(
      '<a href="%s" class="wpff-form-filter-link">%s<span class="wpff-form-filter-icon" aria-hidden="true">%s</span></a>',
      esc_url($url),
      esc_html($post->post_title),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M1.5 3A1.5 1.5 0 0 1 3 1.5h10A1.5 1.5 0 0 1 14.5 3v1.172a1.5 1.5 0 0 1-.44 1.06L10 9.294V13.5a.5.5 0 0 1-.276.447l-3 1.5A.5.5 0 0 1 6 15v-5.706L1.94 5.232A1.5 1.5 0 0 1 1.5 4.172V3Z"/></svg>'
    );
  }

  public function column_summary($entry): string
  {
    $view_url = add_query_arg([
      'page'     => 'wpff_entries',
      'view'     => 'single',
      'entry_id' => $entry->id,
    ], admin_url('admin.php'));

    $preview = $this->build_summary($entry->answers);
    $weight  = $entry->is_read ? 'normal' : 'bold';

    return sprintf(
      '<a href="%s" style="font-weight:%s">%s</a>',
      esc_url($view_url),
      $weight,
      esc_html($preview)
    );
  }

  public function column_submitted($entry): string
  {
    $ts        = strtotime($entry->created_at);
    $relative  = human_time_diff($ts, current_time('timestamp')) . ' ' . __('ago', 'wp-flowforms');
    $absolute  = wp_date(get_option('date_format') . ' ' . get_option('time_format'), $ts);

    return sprintf('<span title="%s">%s</span>', esc_attr($absolute), esc_html($relative));
  }

  public function column_actions($entry): string
  {
    $base = remove_query_arg(['action', '_wpnonce', 'entry_id', 'paged']);

    $view_url = add_query_arg([
      'page'     => 'wpff_entries',
      'view'     => 'single',
      'entry_id' => $entry->id,
    ], admin_url('admin.php'));

    if ($this->status === 'trash') {
      $actions = [
        'restore' => sprintf(
          '<a href="%s">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'restore', 'entry_id' => $entry->id], $base), 'wpff_entry_restore')),
          esc_html__('Restore', 'wp-flowforms')
        ),
        'delete' => sprintf(
          '<a href="%s" class="submitdelete" onclick="return confirm(\'%s\')">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'delete', 'entry_id' => $entry->id], $base), 'wpff_entry_delete')),
          esc_js(__('Permanently delete this entry?', 'wp-flowforms')),
          esc_html__('Delete Permanently', 'wp-flowforms')
        ),
      ];
    } elseif ($this->status === 'spam') {
      $actions = [
        'unspam' => sprintf(
          '<a href="%s">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'unspam', 'entry_id' => $entry->id], $base), 'wpff_entry_unspam')),
          esc_html__('Not Spam', 'wp-flowforms')
        ),
        'trash' => sprintf(
          '<a href="%s" class="submitdelete">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'trash', 'entry_id' => $entry->id], $base), 'wpff_entry_trash')),
          esc_html__('Trash', 'wp-flowforms')
        ),
      ];
    } else {
      $actions = [
        'view' => sprintf(
          '<a href="%s">%s</a>',
          esc_url($view_url),
          esc_html__('View', 'wp-flowforms')
        ),
        'spam' => sprintf(
          '<a href="%s">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'spam', 'entry_id' => $entry->id], $base), 'wpff_entry_spam')),
          esc_html__('Spam', 'wp-flowforms')
        ),
        'trash' => sprintf(
          '<a href="%s" class="submitdelete">%s</a>',
          esc_url(wp_nonce_url(add_query_arg(['action' => 'trash', 'entry_id' => $entry->id], $base), 'wpff_entry_trash')),
          esc_html__('Trash', 'wp-flowforms')
        ),
      ];
    }

    $actions = apply_filters('wpff_entries_row_actions', $actions, $entry);

    $parts = [];
    foreach ($actions as $key => $link) {
      $parts[] = sprintf('<span class="%s">%s</span>', esc_attr($key), $link);
    }

    return '<div class="wpff-actions">' . implode(' | ', $parts) . '</div>';
  }

  public function column_status($entry): string
  {
    if ($entry->is_read) {
      return '<span class="wpff-status wpff-status--read">' . esc_html__('Read', 'wp-flowforms') . '</span>';
    }

    return '<span class="wpff-status wpff-status--unread">' . esc_html__('Unread', 'wp-flowforms') . '</span>';
  }

  public function column_default($entry, $column_name): string
  {
    return apply_filters('wpff_entries_column_value', '', $entry, $column_name);
  }

  public function get_bulk_actions(): array
  {
    if ($this->status === 'trash') {
      return [
        'restore' => __('Restore', 'wp-flowforms'),
        'delete'  => __('Delete Permanently', 'wp-flowforms'),
      ];
    }

    if ($this->status === 'spam') {
      return [
        'unspam' => __('Not Spam', 'wp-flowforms'),
        'delete' => __('Delete Permanently', 'wp-flowforms'),
      ];
    }

    return [
      'mark_read'   => __('Mark as Read', 'wp-flowforms'),
      'mark_unread' => __('Mark as Unread', 'wp-flowforms'),
      'star'        => __('Star', 'wp-flowforms'),
      'trash'       => __('Move to Trash', 'wp-flowforms'),
      'spam'        => __('Mark as Spam', 'wp-flowforms'),
    ];
  }

  protected function get_views(): array
  {
    $base   = admin_url('admin.php?page=wpff_entries');
    if ($this->form_id) {
      $base = add_query_arg('form_id', $this->form_id, $base);
    }

    $counts = $this->counts;
    $views  = [];

    // All (active).
    $unread_badge = $counts['unread'] > 0
      ? ' <span class="wpff-unread-badge">' . $counts['unread'] . '</span>'
      : '';

    $views['active'] = sprintf(
      '<a href="%s"%s>%s%s <span class="count">(%d)</span></a>',
      esc_url($base),
      $this->status === 'active' ? ' class="current"' : '',
      esc_html__('All', 'wp-flowforms'),
      $unread_badge,
      $counts['active']
    );

    // Starred.
    if ($counts['starred'] > 0 || $this->status === 'starred') {
      $views['starred'] = sprintf(
        '<a href="%s"%s>%s <span class="count">(%d)</span></a>',
        esc_url(add_query_arg('status', 'starred', $base)),
        $this->status === 'starred' ? ' class="current"' : '',
        esc_html__('Starred', 'wp-flowforms'),
        $counts['starred']
      );
    }

    // Spam.
    if ($counts['spam'] > 0 || $this->status === 'spam') {
      $views['spam'] = sprintf(
        '<a href="%s"%s>%s <span class="count">(%d)</span></a>',
        esc_url(add_query_arg('status', 'spam', $base)),
        $this->status === 'spam' ? ' class="current"' : '',
        esc_html__('Spam', 'wp-flowforms'),
        $counts['spam']
      );
    }

    // Trash.
    if ($counts['trash'] > 0 || $this->status === 'trash') {
      $views['trash'] = sprintf(
        '<a href="%s"%s>%s <span class="count">(%d)</span></a>',
        esc_url(add_query_arg('status', 'trash', $base)),
        $this->status === 'trash' ? ' class="current"' : '',
        esc_html__('Trash', 'wp-flowforms'),
        $counts['trash']
      );
    }

    return $views;
  }

  protected function extra_tablenav($which)
  {
    if ($which !== 'top' || empty($this->items)) {
      return;
    }

    $base = remove_query_arg(['action', '_wpnonce', 'entry_id']);

    if ($this->status === 'trash') {
      $url = wp_nonce_url(add_query_arg('action', 'empty_trash', $base), 'wpff_entry_empty_trash');
      printf(
        '<a href="%s" class="button wpff-empty-btn" onclick="return confirm(\'%s\')">%s</a>',
        esc_url($url),
        esc_js(__('Permanently delete all trashed entries?', 'wp-flowforms')),
        esc_html__('Empty Trash', 'wp-flowforms')
      );
    } elseif ($this->status === 'spam') {
      $url = wp_nonce_url(add_query_arg('action', 'empty_spam', $base), 'wpff_entry_empty_spam');
      printf(
        '<a href="%s" class="button wpff-empty-btn" onclick="return confirm(\'%s\')">%s</a>',
        esc_url($url),
        esc_js(__('Permanently delete all spam entries?', 'wp-flowforms')),
        esc_html__('Empty Spam', 'wp-flowforms')
      );
    }
  }

  public function prepare_items()
  {
    $columns               = $this->get_columns();
    $hidden                = [];
    $sortable              = $this->get_sortable_columns();
    $this->_column_headers = [$columns, $hidden, $sortable];

    // phpcs:disable WordPress.Security.NonceVerification.Recommended
    $page    = $this->get_pagenum();
    $order   = (isset($_GET['order']) && strtolower($_GET['order']) === 'asc') ? 'ASC' : 'DESC';
    $orderby = isset($_GET['orderby']) ? sanitize_key($_GET['orderby']) : 'id';
    $search  = isset($_GET['s']) ? sanitize_text_field(wp_unslash($_GET['s'])) : '';
    $date    = isset($_GET['date']) ? sanitize_key($_GET['date']) : '';
    // phpcs:enable WordPress.Security.NonceVerification.Recommended

    $per_page = $this->get_items_per_page('wpff_entries_per_page', FlowForms_Entries_Overview::PER_PAGE_DEFAULT);

    [$date_after, $date_before] = $this->resolve_date_range($date);

    $is_starred = null;
    $status     = $this->status;
    if ($this->status === 'starred') {
      $status     = 'active';
      $is_starred = true;
    }

    $entry_obj = wp_flowforms()->obj('entry');
    $result    = $entry_obj->get_multiple([
      'form_id'     => $this->form_id,
      'status'      => $status,
      'is_starred'  => $is_starred,
      'search'      => $search,
      'orderby'     => $orderby,
      'order'       => $order,
      'per_page'    => $per_page,
      'paged'       => $page,
      'date_after'  => $date_after,
      'date_before' => $date_before,
    ]);

    $this->items  = $result['entries'];
    $this->counts = $entry_obj->get_counts($this->form_id);

    $this->set_pagination_args([
      'total_items' => $result['total'],
      'per_page'    => $per_page,
      'total_pages' => (int) ceil($result['total'] / $per_page),
    ]);
  }

  public function no_items()
  {
    if ($this->status === 'trash') {
      esc_html_e('Trash is empty.', 'wp-flowforms');
    } elseif ($this->status === 'spam') {
      esc_html_e('No spam entries.', 'wp-flowforms');
    } else {
      esc_html_e('No entries found. Try adjusting your filters.', 'wp-flowforms');
    }
  }

  /**
   * Build a short preview string from an answers array.
   *
   * @param array $answers
   * @return string
   */
  private function build_summary(array $answers): string
  {
    $parts = [];
    foreach ($answers as $value) {
      if ($value === null || $value === '') {
        continue;
      }
      $text    = is_array($value) ? implode(', ', $value) : (string) $value;
      $text    = wp_strip_all_tags($text);
      $parts[] = mb_substr($text, 0, 40, 'UTF-8');

      if (count($parts) >= 3) {
        break;
      }
    }

    $preview = implode(' · ', $parts);

    return mb_strlen($preview, 'UTF-8') > 80
      ? mb_substr($preview, 0, 80, 'UTF-8') . '…'
      : $preview;
  }

  /**
   * Resolve a date preset slug into after/before MySQL datetime strings.
   *
   * @param string $preset
   * @return array{ 0: string, 1: string }
   */
  private function resolve_date_range(string $preset): array
  {
    $now = current_time('timestamp');

    switch ($preset) {
      case 'today':
        return [gmdate('Y-m-d 00:00:00', $now), gmdate('Y-m-d 23:59:59', $now)];
      case 'yesterday':
        $y = $now - DAY_IN_SECONDS;
        return [gmdate('Y-m-d 00:00:00', $y), gmdate('Y-m-d 23:59:59', $y)];
      case '7days':
        return [gmdate('Y-m-d 00:00:00', $now - 7 * DAY_IN_SECONDS), ''];
      case '30days':
        return [gmdate('Y-m-d 00:00:00', $now - 30 * DAY_IN_SECONDS), ''];
      case 'month':
        return [gmdate('Y-m-01 00:00:00', $now), ''];
      default:
        return ['', ''];
    }
  }
}
