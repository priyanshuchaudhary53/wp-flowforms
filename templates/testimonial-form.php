<?php

if (! defined('ABSPATH')) exit;

return [
  'slug'          => 'testimonial-form',
  'name'          => 'Testimonial Form',
  'description'   => 'Get powerful user-generated content with our testimonial form template.',
  'category'      => 'feedback',
  'thumbnail_url' => FLOWFORMS_URL . 'assets/images/templates/testimonial-form.webp',
  'content'     => [
    'welcomeScreen' => [
      'content'  => [
        'title'       => 'Ready to share your testimonial?',
        'description' => '',
        'buttonLabel' => 'Share',
      ],
      'settings' => [
        'layout' => 'default',
        'backgroundImage' => ['id' => null, 'url' => FLOWFORMS_URL . 'assets/images/templates/bg/testimonial-welcome.jpg'],
        'bgLayout' => 'split',
        'bgPosition' => 'right',
      ],
    ],
    'thankYouScreen' => [
      'content'  => [
        'title'       => 'Thank you!',
        'description' => 'We\'re all done.',
      ],
      'settings' => [
        'layout' => 'default',
        'showSocialShare' => false,
        'redirectUrl' => '',
        'redirectDelay' => 0,
        'backgroundImage' => ['id' => null, 'url' => FLOWFORMS_URL . 'assets/images/templates/bg/testimonial-thanks.jpg'],
        'bgLayout' => 'split',
        'bgPosition' => 'right',
      ],
    ],
    'questions' => [
      [
        'id' => '751cc2bc-5f53-4dcc-9241-f33c2a8130a9',
        'type' => 'short_text',
        'content' => [
          'title' => 'First up, what\'s your full name?',
          'description' => '',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'Jane Doe',
          'backgroundImage' => '',
          'maxLength' => 255,
        ],
      ],
      [
        'id' => 'b9126b33-079a-4f49-b4b8-1bf3bddd269a',
        'type' => 'short_text',
        'content' => [
          'title' => 'What\'s your company name and job title?',
          'description' => 'If you\'re self-employed, that\'s great too!',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'Company',
          'backgroundImage' => '',
          'maxLength' => 255,
        ]
      ],
      [
        'id' => '8aec2fbd-6e66-4dc2-8886-6665fdffeb4d',
        'type' => 'long_text',
        'content' => [
          'title' => 'Thanks! Time to share your testimonial.',
          'description' => 'Let us know what you loved about working together.',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => '',
          'backgroundImage' => '',
          'maxLength' => 2000,
          'rows' => 4,
        ]
      ],
      [
        'id' => 'dd03057e-06cb-468b-84aa-2099ffafd017',
        'type' => 'rating',
        'content' => [
          'title' => 'How would you rate your experience?',
          'description' => '',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'steps' => 5,
          'backgroundImage' => '',
        ]
      ],
      [
        'id' => '06c80c6f-33de-4eb8-845e-2b5d1fca156c',
        'type' => 'email',
        'content' => [
          'title' => 'Can we take your email?',
          'description' => 'We\'ll send you a special offer as a thank you.',
          'buttonLabel' => 'OK',
        ],
        'settings' => [
          'required' => true,
          'placeholder' => 'name@example.com',
          'backgroundImage' => '',
          'confirmEmail' => false,
        ]
      ],
      [
        'id' => '1b0e907b-9a26-483c-9714-d233cf72c6d7',
        'type' => 'yes_no',
        'content' => [
          'title' => 'And finally, can we use your testimonial on our website?',
          'description' => '',
          'buttonLabel' => 'OK',
          'yesLabel' => 'Yes',
          'noLabel' => 'No',
        ],
        'settings' => [
          'required' => true,
          'backgroundImage' => '',
        ]
      ]
    ],
  ],
  'design' => [
    'bg_color'            => '#695320',
    'title_color'         => '#e7f4fd',
    'description_color'   => '#ced4d1',
    'field_color'         => '#f9fafb',
    'button_color'        => '#E7F4FD',
    'button_hover_color'  => '#d0dce4',
    'button_text_color'   => '#766336',
    'star_color'          => '#ced4d1',
    'alignment'           => 'left',
    'google_font'         => 'Inter',
    'font_size'           => 'large',
    'border_radius'       => 'full',
    'answer_color'        => '#e7f4fd',
    'hint_color'          => '#9c9379',
  ],
];
