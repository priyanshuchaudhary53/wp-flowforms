<?php

if (! defined('ABSPATH')) exit;

return [
  'slug'        => 'lead-generation-survey',
  'name'        => 'Lead Generation Survey',
  'description' => 'Find out how your business is generating leads and which marketing channels are most successful.',
  'category'    => 'lead-gen',
  'content'     => [
    'welcomeScreen' => [
      'content'  => [
        'title'       => 'How does your team generate leads?',
        'description' => 'Take our quick survey and we\'ll send you an exclusive code to try our new sales and marketing platform for free.',
        'buttonLabel' => 'Start survey',
      ],
      'settings' => [
        'layout'          => 'default',
        'backgroundImage' => ['id' => 289, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/toa-heftiba-4xe-yVFJCvw-unsplash-scaled.jpg'],
        'bgLayout' => 'split',
        'bgPosition' => 'right',
      ],
    ],
    'thankYouScreen' => [
      'content'  => [
        'title'       => 'Thanks for your time!',
        'description' => '',
      ],
      'settings' => [
        'layout'          => 'default',
        'showSocialShare' => false,
        'redirectUrl'     => '',
        'redirectDelay'   => 0,
      ],
    ],
    'questions' => [
      [
        'id' => 'q_name',
        'type' => 'short_text',
        'content' => [
          'title' => 'First, what\'s your name?',
          'description' => '',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'Jane',
        ],
      ],
      [
        'id' => 'q_email',
        'type' => 'email',
        'content' => [
          'title' => 'And your email?',
          'description' => 'We\'ll send your free trial code here.',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'name@example.com',
        ],
      ],
      [
        'id' => 'q_interest',
        'type' => 'multiple_choice',
        'content' => [
          'title' => 'Which department do you work in?',
          'description' => '',
          'buttonLabel' => 'OK',
          'options' => [
            ['id' => 'opt-0', 'label' => 'Marketing'],
            ['id' => 'opt-1', 'label' => 'Sales'],
          ],
        ],
        'settings' => [
          'required' => true,
          'allowOther' => true,
          'layout' => 'vertical',
        ],
      ],
      [
        'id' => '0736ad1c-4db5-487f-83aa-00fd0a0d1346',
        'type' => 'checkboxes',
        'content' => [
          'title' => 'How does your team typically capture new leads?',
          'description' => '',
          'buttonLabel' => 'OK',
          'options' => [
            ['id' => 'opt-0', 'label' => 'Manual CRM entry'],
            ['id' => 'opt-1', 'label' => 'Lead capture forms'],
            ['id' => 'opt-2', 'label' => 'Marketing automation tool'],
          ],
        ],
        'settings' => [
          'required' => true,
          'minSelections' => 0,
          'maxSelections' => 0,
          'allowOther' => true,
          'randomize' => false,
          'layout' => 'vertical',
          'backgroundImage' => ['id' => 290, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/daria-pimkina-Dj5HnHMtkH0-unsplash-scaled.jpg'],
          'bgBrightness' => 0,
          'bgLayout' => 'split',
          'bgPosition' => 'right',
        ]
      ],
      [
        'id' => 'c11a5552-2583-441d-a7fe-3d3408a11ba4',
        'type' => 'multiple_choice',
        'content' => [
          'title' => 'How do you typically generate new leads?',
          'description' => '',
          'buttonLabel' => 'OK',
          'options' => [
            ['id' => 'opt-0', 'label' => 'Gated content'],
            ['id' => 'opt-1', 'label' => 'Webinars'],
            ['id' => 'opt-2', 'label' => 'Marketing quizzes'],
          ],
        ],
        'settings' => [
          'required' => true,
          'allowOther' => false,
          'randomize' => false,
          'layout' => 'vertical',
          'backgroundImage' => '',
        ],
      ],
      [
        'id' => '837faf02-f9d9-445b-b4dc-c17e9ab79f96',
        'type' => 'checkboxes',
        'content' => [
          'title' => 'Which channels attract the most leads for the Marketing team?',
          'description' => '',
          'buttonLabel' => 'OK',
          'options' => [
            ['id' => 'opt-0', 'label' => 'Social media'],
            ['id' => 'opt-1', 'label' => 'PPC campaigns'],
            ['id' => 'opt-2', 'label' => 'Email marketing'],
          ],
        ],
        'settings' => [
          'required' => true,
          'minSelections' => 0,
          'maxSelections' => 0,
          'allowOther' => false,
          'randomize' => false,
          'layout' => 'vertical',
          'backgroundImage' => '',
        ],
      ],
    ],
    'design' => [
      'bg_color' => '#ffffff',
      'title_color' => '#2e2c2c',
      'description_color' => '#524b47',
      'field_color' => '#1f2937',
      'button_color' => '#047B48',
      'button_hover_color' => '#1d885a',
      'button_text_color' => '#ffffff',
      'star_color' => '#f59e0b',
      'alignment' => 'left',
      'google_font' => 'Lato',
      'font_size' => 'regular',
      'answer_color' => '#2e2c2c',
      'hint_color' => '#ABABAB',
      'bg_image' => ['id' => 287, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/gradient-bg-1.webp'],
    ],
  ],
];
