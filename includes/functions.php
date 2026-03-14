<?php

/**
 * Global functions.
 * 
 * @since 1.0.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

function wpff_is_admin_page($slug)
{
  $page = ((array) ($_REQUEST['page'] ?? ''))[0];


  // Check against basic requirements.
  if (
    strpos($page, 'wpff') === false ||
    ! is_admin()
  ) {
    return false;
  }

  // Check against page slug identifier.
  if (
    (! empty($slug) && $_REQUEST['page'] !== 'wpff_' . $slug) ||
    (empty($slug) && $_REQUEST['page'] === 'wpff_form_builder')
  ) {
    return false;
  }

  return true;
}

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
