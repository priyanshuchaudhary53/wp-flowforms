<?php

if (! defined('ABSPATH')) exit;

/**
 * FlowForms_Entry_Handler
 *
 * All database operations for form entries.
 *
 * @since 1.1.0
 */
class FlowForms_Entry_Handler
{
  /**
   * Entries table name (without prefix).
   */
  const TABLE = 'flowforms_entries';

  /**
   * Allowed entry statuses.
   */
  const STATUSES = ['active', 'spam', 'trash'];

  /**
   * Return the full table name with wpdb prefix.
   */
  public static function table(): string
  {
    global $wpdb;
    return $wpdb->prefix . self::TABLE;
  }

  /**
   * Fetch a single entry by ID.
   *
   * @param int $entry_id
   * @return object|null
   */
  public function get(int $entry_id): ?object
  {
    global $wpdb;

    $row = $wpdb->get_row(
      $wpdb->prepare(
        'SELECT * FROM %i WHERE id = %d',
        self::table(),
        $entry_id
      )
    );

    return $row ? $this->prepare_entry($row) : null;
  }

  /**
   * Fetch multiple entries with filtering, sorting and pagination.
   *
   * @param array $args {
   *   @type int    $form_id     Filter by form ID.
   *   @type string $status      'active' | 'spam' | 'trash'. Default 'active'.
   *   @type bool   $is_starred  Filter starred entries.
   *   @type string $search      Search term against answers JSON.
   *   @type string $orderby     Column to order by. Default 'id'.
   *   @type string $order       'ASC' | 'DESC'. Default 'DESC'.
   *   @type int    $per_page    Items per page. Default 20.
   *   @type int    $paged       Page number. Default 1.
   *   @type string $date_after  MySQL datetime string.
   *   @type string $date_before MySQL datetime string.
   * }
   * @return array{ entries: object[], total: int }
   */
  public function get_multiple(array $args = []): array
  {
    global $wpdb;

    $defaults = [
      'form_id'     => 0,
      'status'      => 'active',
      'is_starred'  => null,
      'search'      => '',
      'orderby'     => 'id',
      'order'       => 'DESC',
      'per_page'    => 20,
      'paged'       => 1,
      'date_after'  => '',
      'date_before' => '',
    ];

    $args = wp_parse_args($args, $defaults);

    $where  = [];
    $values = [];

    // Status.
    $status = in_array($args['status'], self::STATUSES, true) ? $args['status'] : 'active';
    $where[]  = 'status = %s';
    $values[] = $status;

    // Form filter.
    if (! empty($args['form_id'])) {
      $where[]  = 'form_id = %d';
      $values[] = absint($args['form_id']);
    }

    // Starred filter.
    if (! is_null($args['is_starred'])) {
      $where[]  = 'is_starred = %d';
      $values[] = (int) (bool) $args['is_starred'];
    }

    // Date range.
    if (! empty($args['date_after'])) {
      $where[]  = 'created_at >= %s';
      $values[] = $args['date_after'];
    }
    if (! empty($args['date_before'])) {
      $where[]  = 'created_at <= %s';
      $values[] = $args['date_before'];
    }

    // Search.
    if (! empty($args['search'])) {
      $term = trim($args['search']);
      if (is_numeric($term)) {
        $where[]  = 'id = %d';
        $values[] = absint($term);
      } else {
        $where[]  = 'answers LIKE %s';
        $values[] = '%' . $wpdb->esc_like($term) . '%';
      }
    }

    $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Orderby whitelist.
    $allowed_orderby = ['id', 'form_id', 'created_at', 'is_read', 'is_starred'];
    $orderby = in_array($args['orderby'], $allowed_orderby, true) ? $args['orderby'] : 'id';
    $order   = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

    // Pagination.
    $per_page = max(1, (int) $args['per_page']);
    $offset   = ($args['paged'] - 1) * $per_page;

    $table = self::table();

    // Total count.
    $count_sql = $values
      ? $wpdb->prepare("SELECT COUNT(*) FROM `{$table}` {$where_sql}", ...$values)
      : "SELECT COUNT(*) FROM `{$table}` {$where_sql}";

    $total = (int) $wpdb->get_var($count_sql);

    // Rows.
    $rows_sql = $values
      ? $wpdb->prepare(
        "SELECT * FROM `{$table}` {$where_sql} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d",
        ...array_merge($values, [$per_page, $offset])
      )
      : $wpdb->prepare(
        "SELECT * FROM `{$table}` {$where_sql} ORDER BY {$orderby} {$order} LIMIT %d OFFSET %d",
        $per_page,
        $offset
      );

    $rows = $wpdb->get_results($rows_sql);

    return [
      'entries' => array_map([$this, 'prepare_entry'], $rows ?: []),
      'total'   => $total,
    ];
  }

  /**
   * Get entry counts grouped by status (and starred) for a given form.
   *
   * @param int $form_id 0 = all forms.
   * @return array{ active: int, starred: int, spam: int, trash: int, unread: int }
   */
  public function get_counts(int $form_id = 0): array
  {
    global $wpdb;
    $table = self::table();

    $form_where  = $form_id ? $wpdb->prepare('AND form_id = %d', $form_id) : '';

    $rows = $wpdb->get_results(
      "SELECT status, is_starred, is_read, COUNT(*) as cnt
             FROM `{$table}`
             WHERE 1=1 {$form_where}
             GROUP BY status, is_starred, is_read"
    );

    $counts = ['active' => 0, 'starred' => 0, 'spam' => 0, 'trash' => 0, 'unread' => 0];

    foreach ($rows as $row) {
      $cnt = (int) $row->cnt;

      if ($row->status === 'active') {
        $counts['active'] += $cnt;
        if (! $row->is_read) {
          $counts['unread'] += $cnt;
        }
        if ($row->is_starred) {
          $counts['starred'] += $cnt;
        }
      } elseif ($row->status === 'spam') {
        $counts['spam'] += $cnt;
      } elseif ($row->status === 'trash') {
        $counts['trash'] += $cnt;
      }
    }

    return $counts;
  }

  /**
   * Get the previous and next entry IDs relative to a given entry,
   * within the same filtered set used to build the list.
   *
   * @param int   $entry_id Current entry ID.
   * @param array $args     Same filter args used for get_multiple().
   * @return array{ prev: int|null, next: int|null }
   */
  public function get_adjacent_ids(int $entry_id, array $args = []): array
  {
    $args['per_page'] = 9999;
    $args['paged']    = 1;
    $result           = $this->get_multiple($args);
    $ids              = array_column($result['entries'], 'id');
    $pos              = array_search($entry_id, $ids, true);

    return [
      'prev' => ($pos !== false && $pos > 0)                   ? (int) $ids[$pos - 1] : null,
      'next' => ($pos !== false && $pos < count($ids) - 1)     ? (int) $ids[$pos + 1] : null,
    ];
  }

  /**
   * Mark one or more entries as read.
   *
   * @param int|int[] $ids
   */
  public function mark_read($ids): void
  {
    $this->update_field($ids, 'is_read', 1);
  }

  /**
   * Mark one or more entries as unread.
   *
   * @param int|int[] $ids
   */
  public function mark_unread($ids): void
  {
    $this->update_field($ids, 'is_read', 0);
  }

  /**
   * Star one or more entries.
   *
   * @param int|int[] $ids
   */
  public function star($ids): void
  {
    $this->update_field($ids, 'is_starred', 1);
  }

  /**
   * Unstar one or more entries.
   *
   * @param int|int[] $ids
   */
  public function unstar($ids): void
  {
    $this->update_field($ids, 'is_starred', 0);
  }

  /**
   * Move entries to a given status.
   *
   * @param int|int[] $ids
   * @param string    $status 'active' | 'spam' | 'trash'
   */
  public function update_status($ids, string $status): void
  {
    if (! in_array($status, self::STATUSES, true)) {
      return;
    }
    $this->update_field($ids, 'status', $status);
  }

  /**
   * Permanently delete entries.
   *
   * @param int|int[] $ids
   * @return int Rows deleted.
   */
  public function delete($ids): int
  {
    global $wpdb;

    $ids   = array_map('absint', (array) $ids);
    $ids   = array_filter($ids);

    if (empty($ids)) {
      return 0;
    }

    $placeholders = implode(',', array_fill(0, count($ids), '%d'));
    $table        = self::table();

    return (int) $wpdb->query(
      $wpdb->prepare("DELETE FROM `{$table}` WHERE id IN ({$placeholders})", ...$ids)
    );
  }

  /**
   * Permanently delete all entries with a given status for a given form (or all forms).
   *
   * @param string $status  'trash' | 'spam'
   * @param int    $form_id 0 = all forms.
   * @return int Rows deleted.
   */
  public function delete_by_status(string $status, int $form_id = 0): int
  {
    global $wpdb;

    if (! in_array($status, self::STATUSES, true)) {
      return 0;
    }

    $table = self::table();

    if ($form_id) {
      return (int) $wpdb->query(
        $wpdb->prepare(
          "DELETE FROM `{$table}` WHERE status = %s AND form_id = %d",
          $status,
          $form_id
        )
      );
    }

    return (int) $wpdb->query(
      $wpdb->prepare("DELETE FROM `{$table}` WHERE status = %s", $status)
    );
  }

  /**
   * Decode the answers JSON and cast typed fields on a raw DB row.
   *
   * @param object $row Raw stdClass from $wpdb.
   * @return object
   */
  private function prepare_entry(object $row): object
  {
    $row->id         = (int) $row->id;
    $row->form_id    = (int) $row->form_id;
    $row->is_read    = (bool) ($row->is_read ?? false);
    $row->is_starred = (bool) ($row->is_starred ?? false);
    $row->answers    = json_decode($row->answers ?? '{}', true) ?: [];

    return $row;
  }

  /**
   * Update a single column for one or more entry IDs.
   *
   * @param int|int[] $ids
   * @param string    $column Whitelisted column name.
   * @param mixed     $value
   */
  private function update_field($ids, string $column, $value): void
  {
    global $wpdb;

    $allowed = ['is_read', 'is_starred', 'status'];
    if (! in_array($column, $allowed, true)) {
      return;
    }

    $ids  = array_map('absint', (array) $ids);
    $ids  = array_filter($ids);

    if (empty($ids)) {
      return;
    }

    $table        = self::table();
    $placeholders = implode(',', array_fill(0, count($ids), '%d'));
    $format       = is_int($value) ? '%d' : '%s';

    $wpdb->query(
      $wpdb->prepare(
        "UPDATE `{$table}` SET `{$column}` = {$format} WHERE id IN ({$placeholders})",
        ...array_merge([$value], $ids)
      )
    );
  }
}
