<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

return [

  // ── Welcome screen ────────────────────────────────────────────────────────
  'welcomeScreen' => [
    'content' => [
      'title'       => "Let's get started",
      'description' => 'This will only take a couple of minutes.',
      'buttonLabel' => 'Start',
    ],
    'settings' => [
      'layout'          => 'center', // center | left
      'backgroundImage' => '',
    ],
  ],

  // ── Thank you screen ──────────────────────────────────────────────────────
  'thankYouScreen' => [
    'content' => [
      'title'       => 'Thank you!',
      'description' => 'Your response has been recorded.',
    ],
    'settings' => [
      'layout'          => 'center', // center | left
      'showSocialShare' => false,
      'redirectUrl'     => '',
      'redirectDelay'   => 0,
    ],
  ],

  // ── Questions ─────────────────────────────────────────────────────────────
  // Empty by default — blocks are added via AddBlockDialog at runtime.
  //
  // Each question follows this shape:
  //   [
  //     'id'      => '<uuid>',
  //     'type'    => 'short_text',
  //     'content' => [
  //       'title'       => '',
  //       'description' => '',
  //       'buttonLabel' => 'OK',
  //       // type-specific: 'yesLabel', 'noLabel', 'startLabel', 'endLabel', etc.
  //     ],
  //     'settings' => [
  //       'required'    => false,
  //       'placeholder' => '',
  //       // type-specific: 'maxLength', 'steps', 'shape', 'allowOther', etc.
  //     ],
  //   ]
  'questions' => [],

  // ── Design ────────────────────────────────────────────────────────────────
  'design' => [
    // Colours
    'bg_color'            => '#ffffff',
    'title_color'         => '#111827', // gray-900
    'description_color'   => '#6b7280', // gray-500
    'field_color'         => '#f9fafb', // gray-50
    'button_color'        => '#111827', // gray-900
    'button_hover_color'  => '#374151', // gray-700
    'button_text_color'   => '#ffffff',
    'star_color'          => '#f59e0b', // amber-500

    // Layout
    'alignment'           => 'left',  // center | left

    // Typography
    'google_font'         => 'Inter',
    'font_size'           => 'regular', // small | regular | large
  ],

];