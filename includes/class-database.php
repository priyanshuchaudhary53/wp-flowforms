<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_Database
{
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
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY form_id (form_id)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);    
  }
}
