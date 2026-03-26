<?php

/**
 * Global functions.
 *
 * @since 1.0.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Check whether the current request is for a specific WP FlowForms admin page.
 *
 * @since 1.0.0
 *
 * @param string $slug Page slug suffix (without the `wpff_` prefix).
 * @return bool
 */
function wpff_is_admin_page($slug)
{
  $page = ((array) ($_REQUEST['page'] ?? ''))[0];

  if (
    strpos($page, 'wpff') === false ||
    ! is_admin()
  ) {
    return false;
  }

  if (
    (! empty($slug) && $_REQUEST['page'] !== 'wpff_' . $slug) ||
    (empty($slug) && $_REQUEST['page'] === 'wpff_form_builder')
  ) {
    return false;
  }

  return true;
}

/**
 * Safely decode a JSON string, unslash it, and return the result as an array.
 *
 * @since 1.0.0
 *
 * @param string $data JSON-encoded string.
 * @return array|false Decoded array on success, false if input is empty, empty array on JSON error.
 */
function wpff_decode($data)
{
  if (empty($data)) {
    return false;
  }

  $decoded_data = json_decode($data, true);

  if (json_last_error() !== JSON_ERROR_NONE) {
    return [];
  }

  return wp_unslash($decoded_data);
}

/**
 * Retrieve a value from the wpff_settings option.
 *
 * Uses static caching so the option is read from the database only once per request,
 * regardless of how many times this function is called.
 *
 * @since 1.0.0
 *
 * @param string $key     Setting key (field ID).
 * @param mixed  $default Value to return when the key does not exist.
 * @return mixed The saved value, or $default if not set.
 */
function wpff_get_setting( string $key, $default = null ) {
  static $settings = null;

  if ( $settings === null ) {
    $settings = get_option( 'wpff_settings', [] );
  }

  return array_key_exists( $key, $settings ) ? $settings[ $key ] : $default;
}

/**
 * Insert one or more key-value pairs into an array after a given key.
 *
 * @param array  $array    Source array.
 * @param array  $insert   Associative array to insert.
 * @param string $after    Key to insert after.
 * @return array
 */
function wpff_array_insert(array $array, array $insert, string $after): array
{
  $pos = array_search($after, array_keys($array), true);

  if ($pos === false) {
    return array_merge($array, $insert);
  }

  return array_merge(
    array_slice($array, 0, $pos + 1, true),
    $insert,
    array_slice($array, $pos + 1, null, true)
  );
}
