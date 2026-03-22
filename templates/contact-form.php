<?php

if (! defined('ABSPATH')) exit;

return [
  'slug'        => 'contact-form',
  'name'        => 'Contact Form',
  'description' => 'Connect with your website visitors with a sleek website contact form.',
  'category'    => 'contact',
  'content'     => [
    'welcomeScreen' => [
      'content'  => [
        'title'       => 'Can\'t find what you\'re looking for or have a burning question?',
        'description' => 'You\'ve come to the right place.',
        'buttonLabel' => 'Get in touch',
      ],
      'settings' => [
        'layout' => 'default',
        'backgroundImage' => ['id' => 304, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/lea-l-q-99IzY8Lw-unsplash-scaled.jpg'],
        'bgLayout' => 'split',
        'bgPosition' => 'left',
      ],
    ],
    'thankYouScreen' => [
      'content'  => [
        'title'       => 'Perfect',
        'description' => 'Our support team will get to work, so keep an eye on your inbox or phone.',
      ],
      'settings' => [
        'layout' => 'default',
        'showSocialShare' => true,
        'redirectUrl' => '',
        'redirectDelay' => 0,
        'backgroundImage' => ['id' => 306, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/lea-l-4N6qT784t3A-unsplash-scaled.jpg'],
        'bgLayout' => 'split',
        'bgPosition' => 'right',
      ],
    ],
    'questions' => [
      [
        "id" => "q_name",
        "type" => "short_text",
        "content" => [
          "title" => "First things first, what's your name?",
          "description" => "",
          "buttonLabel" => "OK",
        ],
        "settings" => [
          "required" => true,
          "placeholder" => "Jane Doe",
        ],
      ],
      [
        "id" => "q_message",
        "type" => "long_text",
        "content" => [
          "title" => "Thanks for reaching out. Tell us what we can do for you?",
          "description" => "",
          "buttonLabel" => "OK",
        ],
        "settings" => [
          "required" => false,
          "placeholder" => "Tell us what's on your mind…",
          "maxLength" => 0,
        ],
      ],
      [
        "id" => "q_email",
        "type" => "email",
        "content" => [
          "title" => "Perfect, we'll look right into it. Mind sharing your email address with us?",
          "description" => "It's so we can get back to you.",
          "buttonLabel" => "OK",
        ],
        "settings" => [
          "required" => true,
          "placeholder" => "name@example.com",
          "confirmEmail" => false,
        ],
      ],
      [
        "id" => "1d0d7ae8-b3a3-4cae-b2d0-0a4d6014320d",
        "type" => "short_text",
        "content" => [
          "title" => "If you prefer to receive a phone call, please share your number.",
          "description" => "",
          "buttonLabel" => "OK",
        ],
        "settings" => [
          "required" => false,
          "placeholder" => "(555) 555-0100",
          "backgroundImage" => "",
          "maxLength" => 255,
        ],
      ],
    ],
    'design' => [
      'bg_color' => '#753B1C',
      'title_color' => '#ebeae2',
      'description_color' => '#d3c7ba',
      'field_color' => '#f9fafb',
      'button_color' => '#ffa474',
      'button_hover_color' => '#e69468',
      'button_text_color' => '#1a100c',
      'star_color' => '#f59e0b',
      'alignment' => 'left',
      'google_font' => 'Merriweather',
      'font_size' => 'small',
      'border_radius' => 'full',
      'answer_color' => '#ebeae2',
      'hint_color' => '#A5816D',
    ],
  ],
];
