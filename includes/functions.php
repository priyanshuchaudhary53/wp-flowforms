<?php

/**
 * Global functions.
 *
 * @since 1.0.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Check whether the current request is for a specific FlowForms admin page.
 *
 * @since 1.0.0
 *
 * @param string $slug Page slug suffix (without the `wpff_` prefix).
 * @return bool
 */
function wpff_is_admin_page($slug)
{
  // phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput -- Page routing param; read-only, no state change. Sanitized via sanitize_key() below.
  $page = sanitize_key( (string) ( $_REQUEST['page'] ?? '' ) );

  if (
    strpos($page, 'wpff') === false ||
    ! is_admin()
  ) {
    // phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput
    return false;
  }

  if (
    (! empty($slug) && $_REQUEST['page'] !== 'wpff_' . $slug) ||
    (empty($slug) && $_REQUEST['page'] === 'wpff_form_builder')
  ) {
    // phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput
    return false;
  }
  // phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput

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

/**
 * Allowed HTML for field icon labels (SVG icon + text label).
 *
 * @since 1.0.0
 *
 * @return array
 */
function wpff_kses_field_icon(): array {
  return [
    'div'  => [ 'class' => [] ],
    'span' => [ 'class' => [], 'style' => [], 'aria-hidden' => [] ],
    'svg'  => [
      'xmlns'          => [],
      'viewbox'        => [],
      'fill'           => [],
      'stroke'         => [],
      'stroke-width'   => [],
      'stroke-linecap' => [],
      'stroke-linejoin' => [],
      'width'          => [],
      'height'         => [],
    ],
    'path'    => [ 'd' => [], 'fill' => [], 'stroke' => [] ],
    'circle'  => [ 'cx' => [], 'cy' => [], 'r' => [], 'fill' => [], 'stroke' => [] ],
    'rect'    => [ 'x' => [], 'y' => [], 'width' => [], 'height' => [], 'rx' => [], 'fill' => [], 'stroke' => [] ],
    'line'    => [ 'x1' => [], 'y1' => [], 'x2' => [], 'y2' => [] ],
    'polyline' => [ 'points' => [] ],
    'polygon'  => [ 'points' => [] ],
  ];
}

/**
 * Allowed HTML for settings form fields (inputs, selects, textareas, etc.).
 *
 * @since 1.0.0
 *
 * @return array
 */
function wpff_kses_settings_field(): array {
  return [
    'tr'       => [],
    'td'       => [ 'colspan' => [] ],
    'th'       => [ 'scope' => [] ],
    'label'    => [ 'for' => [], 'class' => [] ],
    'input'    => [ 'type' => [], 'id' => [], 'name' => [], 'value' => [], 'placeholder' => [], 'class' => [], 'checked' => [] ],
    'textarea' => [ 'id' => [], 'name' => [], 'rows' => [], 'class' => [] ],
    'select'   => [ 'id' => [], 'name' => [] ],
    'option'   => [ 'value' => [], 'selected' => [] ],
    'h2'       => [ 'class' => [] ],
    'p'        => [ 'class' => [] ],
    'span'     => [ 'class' => [] ],
    'a'        => [ 'href' => [], 'class' => [], 'target' => [], 'rel' => [] ],
  ];
}

/**
 * Allowed HTML for form container output (container div, trashed notice).
 *
 * @since 1.0.0
 *
 * @return array
 */
function wpff_kses_form_container(): array {
  return [
    'div'    => [ 'class' => [], 'style' => [], 'data-flowform-id' => [], 'data-ff-mode' => [] ],
    'span'   => [ 'style' => [] ],
    'strong' => [],
    'a'      => [ 'href' => [], 'style' => [] ],
  ];
}
