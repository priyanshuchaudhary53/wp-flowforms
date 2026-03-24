<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Default form settings applied to every new form — blank or from a template.
 *
 * Shape mirrors the top-level "settings" key in post_content:
 *   {
 *     "content":  { "published": ..., "draft": ... },
 *     "design":   { ... },
 *     "settings": { <this file> }
 *   }
 *
 * To add a new setting: add it here. All new forms will get the default
 * automatically. Existing forms receive it the first time their settings
 * are saved (merge happens in update_settings via wp_parse_args).
 *
 * @since 1.0.0
 */
return [

  // ── General ───────────────────────────────────────────────────────────────
  'general' => [

    // Show a progress bar at the top of the form.
    'progress_bar'      => true,

    // Show previous / next navigation arrows.
    'navigation_arrows' => true,

    // Show "Powered by WP FlowForms" badge at the bottom of the form.
    'powered_by'        => false,

  ],

  // ── Email notifications ───────────────────────────────────────────────────
  'email' => [
    'notifications' => [],
  ],

];