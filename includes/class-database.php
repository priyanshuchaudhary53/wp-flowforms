<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

class FlowForms_Database
{
  /**
   * Create or upgrade the entries database table using dbDelta.
   *
   * @since 1.0.0
   */
  public static function create_tables()
  {
    global $wpdb;
    $table = $wpdb->prefix . 'flowforms_entries';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table (
      id bigint(20) NOT NULL AUTO_INCREMENT,
      form_id bigint(20) NOT NULL,
      answers longtext NOT NULL,
      ip_address varchar(45) DEFAULT '',
      user_agent text DEFAULT '',
      status varchar(20) NOT NULL DEFAULT 'active',
      is_read tinyint(1) NOT NULL DEFAULT 0,
      is_starred tinyint(1) NOT NULL DEFAULT 0,
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY form_id (form_id),
      KEY status (status),
      KEY is_starred (is_starred)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
  }
}
