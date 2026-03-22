<?php

if (! defined('ABSPATH')) exit;

return [
  'slug'          => 'customer-feedback',
  'name'          => 'Customer Feedback',
  'description'   => 'Beautiful, fun, easy to complete. Comes with useful rating questions.',
  'category'      => 'feedback',
  'thumbnail_url' => WP_FLOWFORMS_URL . 'assets/images/templates/customer-feedback.webp',
  'content'     => [
    'welcomeScreen' => [
      'content'  => [
        'title'       => 'Share your feedback',
        'description' => 'We\'d love to hear about your experience.',
        'buttonLabel' => 'Give feedback',
      ],
      'settings' => [
        'layout'          => 'center',
        'backgroundImage' => '',
      ],
    ],
    'thankYouScreen' => [
      'content'  => [
        'title'       => 'Thank you!',
        'description' => 'We hope you visit us again soon.',
      ],
      'settings' => [
        'layout'          => 'center',
        'showSocialShare' => false,
        'redirectUrl'     => '',
        'redirectDelay'   => 0,
      ],
    ],
    'questions' => [
      [
        'id' => '07ca3a14-b574-4daf-a0a2-d1468591a746',
        'type' => 'short_text',
        'content' => [
          'title' => 'First, what\'s your name?',
          'description' => 'First name',
          'buttonLabel' => 'OK'
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'Jane',
          'backgroundImage' => '',
          'maxLength' => 255
        ]
      ],
      [
        'id' => '79786793-adc4-41de-9402-cc1efe4d228b',
        'type' => 'email',
        'content' => [
          'title' => 'Thanks! Now, what\'s your email?',
          'description' => 'We\'ll send you a coupon for 15% off your next purchase.',
          'buttonLabel' => 'OK'
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'name@example.com',
          'backgroundImage' => '',
          'confirmEmail' => false
        ]
      ],
      [
        'id' => '8315eda4-7da4-4976-a9b9-8bb9538fa6f2',
        'type' => 'rating',
        'content' => [
          'title' => 'How would you rate your shopping experience overall?',
          'description' => '',
          'buttonLabel' => 'OK'
        ],
        'settings' => [
          'required' => true,
          'steps' => 5,
          'backgroundImage' => ['id' => 294, 'url' => 'http://localhost:10053/wp-content/uploads/2026/03/ruslan-bardash-4kTbAMRAHtQ-unsplash-scaled.jpg'],
          'bgLayout' => 'split',
          'bgPosition' => 'right'
        ]
      ],
      [
        'id' => '90b0a0b0-5fdf-40c4-b916-d9d9f44b69ce',
        'type' => 'multiple_choice',
        'content' => [
          'title' => 'Which occasion were you shopping for?',
          'description' => '',
          'buttonLabel' => 'OK',
          'options' => [
            ['id' => 'opt-0', 'label' => 'Birthday'],
            ['id' => 'opt-1', 'label' => 'Anniversary'],
            ['id' => 'opt-2', 'label' => 'Wedding']
          ]
        ],
        'settings' => [
          'required' => true,
          'allowOther' => true,
          'randomize' => false,
          'layout' => 'horizontal',
          'backgroundImage' => ''
        ]
      ],
      [
        'id' => '2f2c9c81-0f55-4279-a0a6-2fb2f9fc69f0',
        'type' => 'long_text',
        'content' => [
          'title' => 'Lastly, do you have any other feedback for us?',
          'description' => 'Sharing your thoughts helps us improve.',
          'buttonLabel' => 'OK'
        ],
        'settings' => [
          'required' => false,
          'placeholder' => 'Type your answer here...',
          'backgroundImage' => '',
          'maxLength' => 2000,
          'rows' => 3
        ]
      ]
    ],
    'design' => [
      'bg_color' => '#1C3D50',
      'title_color' => '#b5ddfc',
      'description_color' => '#96bdda',
      'field_color' => '#f9fafb',
      'button_color' => '#B5DEFC',
      'button_hover_color' => '#a3c8e3',
      'button_text_color' => '#2a4d61',
      'star_color' => '#96bdda',
      'alignment' => 'left',
      'google_font' => 'Cormorant Garamond',
      'font_size' => 'large',
      'border_radius' => 'angular',
      'answer_color' => '#b5ddfc',
      'hint_color' => '#597D94'
    ],
  ],
];
