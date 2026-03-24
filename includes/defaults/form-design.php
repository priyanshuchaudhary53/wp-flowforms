<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Default form design applied to every new blank form.
 *
 * Shape mirrors the top-level "design" key in post_content:
 *   {
 *     "content":  { "published": ..., "draft": ... },
 *     "design":   { <this file> },
 *     "settings": { ... }
 *   }
 *
 * Keys must stay in sync with DESIGN_DEFAULTS in src/form/designTokens.js —
 * the JS file is the canonical reference for what tokens the renderer reads.
 *
 * @since 1.0.0
 */
return [

  // ── Colours ───────────────────────────────────────────────────────────────
  'bg_color'           => '#ffffff',
  'title_color'        => '#111827', // gray-900
  'description_color'  => '#6b7280', // gray-500
  'answer_color'       => '#111827', // gray-900
  'hint_color'         => '#9ca3af', // gray-400
  'field_color'        => '#f9fafb', // gray-50
  'button_color'       => '#111827', // gray-900
  'button_hover_color' => '#374151', // gray-700
  'button_text_color'  => '#ffffff',
  'star_color'         => '#f59e0b', // amber-500

  // ── Layout ────────────────────────────────────────────────────────────────
  'alignment'          => 'left',    // left | center
  'border_radius'      => 'rounded', // angular | rounded | full

  // ── Typography ────────────────────────────────────────────────────────────
  'google_font'        => '',        // empty = use theme/system font
  'font_size'          => 'regular', // small | regular | large

];
