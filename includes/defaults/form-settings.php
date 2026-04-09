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

  // General
  'general' => [

    // Show a progress bar at the top of the form.
    'progress_bar'      => true,

    // Show previous / next navigation arrows.
    'navigation_arrows' => true,

    // Show "Powered by FlowForms" badge at the bottom of the form.
    'powered_by'        => false,

  ],

  // Email notifications
  'email' => [

    // Global on/off switch for all notifications on this form.
    'enabled' => true,

    // Numbered notification items. Key is the stable notification ID.
    'notifications' => [

      '1' => [

        // Human-readable name shown in the builder (not sent in the email).
        'name' => 'Admin Notification',

        // Recipient address. Supports smart tags.
        // Default: {admin_email} — resolves to get_option('admin_email').
        'email' => '{admin_email}',

        // Email subject line. Supports smart tags.
        'subject' => 'New submission: {form_name}',

        // From name shown in the email client. Supports smart tags.
        // Default: {site_name} — resolves to get_bloginfo('name').
        'sender_name' => '{site_name}',

        // From address. Supports smart tags.
        // Default: {admin_email} — resolves to get_option('admin_email').
        'sender_address' => '{admin_email}',

        // Reply-To address. Empty = use sender_address. Supports smart tags.
        'replyto' => '',

        // Email body. {all_fields} renders all submitted field values.
        'message' => "Hi,\n\nYour form {form_name} just received a new submission.\n\nHere are the details:\n\n{all_fields}",

      ],

    ],

  ],

];