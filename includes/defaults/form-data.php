<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

return [

  // Welcome screen
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

  // Thank you screen
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

  // Questions
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

];