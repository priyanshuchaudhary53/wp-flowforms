<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly  

class FlowForms_REST_API
{
  public function __construct()
  {
    add_action('rest_api_init', [$this, 'register_routes']);
  }

  public function register_routes()
  {
    $ns = 'formflow/v1';

    // GET all forms (for list page)
    // register_rest_route($ns, '/forms', [
    //   'methods'  => 'GET',
    //   'callback' => [$this, 'get_forms'],
    //   'permission_callback' => fn() => current_user_can('edit_posts'),
    // ]);

    // GET single form (builder loads this)
    register_rest_route($ns, '/forms/(?P<id>\d+)', [
      'methods'  => 'GET',
      'callback' => [$this, 'get_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST create form
    register_rest_route($ns, '/forms', [
      'methods'  => 'POST',
      'callback' => [$this, 'create_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // PUT update form (builder auto-saves here)
    register_rest_route($ns, '/forms/(?P<id>\d+)', [
      'methods'  => 'PATCH',
      'callback' => [$this, 'update_form'],
      'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);

    // POST submit (public — no authentication required)
    register_rest_route($ns, '/forms/(?P<id>\d+)/submit', [
      'methods'             => 'POST',
      'callback'            => [$this, 'handle_submission'],
      'permission_callback' => '__return_true',
      'args'                => [
        'id' => [
          'validate_callback' => fn($v) => is_numeric($v) && $v > 0,
          'sanitize_callback' => 'absint',
        ],
      ],
    ]);
  }

  public function get_form($request)
  {
    $form_id = absint($request['id']);

    if (! $form_id) {
      return new WP_Error(
        'invalid_form_id',
        __('Invalid form ID.', 'wp-flowforms'),
        ['status' => 400]
      );
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error(
        'form_not_found',
        __('Form not found.', 'wp-flowforms'),
        ['status' => 404]
      );
    }

    $form = [
      'id'            => $post->ID,
      'title'         => $post->post_title,
      'status'        => $post->post_status,
      'content'       => wpff_decode($post->post_content),
      'date_created'  => $post->post_date,
      'date_updated'  => $post->post_modified,
      'public_url'    => FlowForms_Frontend::get_public_url($post->ID),
      'preview_url'   => FlowForms_Frontend::get_preview_url($post->ID),
    ];

    return rest_ensure_response($form);
  }

  public function create_form($request)
  {
    // Get params
    $form_name = sanitize_text_field($request->get_param('form_name'));
    $form_data = $request->get_param('form_data');

    // Default form name
    if (empty($form_name)) {
      $form_name = __('Untitled form', 'wp-flowforms');
    }

    // Decode JSON if needed
    if (is_string($form_data)) {
      $decoded = json_decode($form_data, true);
      if (json_last_error() === JSON_ERROR_NONE) {
        $form_data = $decoded;
      }
    }

    // Use default if empty
    if (empty($form_data)) {
      $form_data = require WP_FLOWFORMS_PATH . 'includes/defaults/form-data.php';
    }

    $post_id = wp_insert_post([
      'post_title'   => $form_name,
      'post_content' => '',
      'post_status'  => 'publish',
      'post_type'    => 'wpff_forms',
    ]);

    if (is_wp_error($post_id)) {
      return new WP_REST_Response(['message' => 'Failed to create form.'], 500);
    }

    $saved = $this->save_post_content($post_id, $this->encode_form_data($form_data));

    if (! $saved) {
      return new WP_REST_Response(['message' => 'Failed to save form content.'], 500);
    }

    return new WP_REST_Response([
      'success'   => true,
      'post_id'   => $post_id,
      'form_name' => $form_name,
      'message'   => 'Form created successfully.',
    ], 201);
  }

  public function update_form($request)
  {
    $form_id   = absint($request['id']);
    $form_name = $request->get_param('form_name');
    $form_data = $request->get_param('form_data');

    if (! $form_id) {
      return new WP_Error('invalid_form_id', __('Invalid form ID.', 'wp-flowforms'), ['status' => 400]);
    }

    $post = get_post($form_id);

    if (! $post || $post->post_type !== 'wpff_forms') {
      return new WP_Error('form_not_found', __('Form not found.', 'wp-flowforms'), ['status' => 404]);
    }

    $has_update = false;

    // Update title via wp_update_post (plain text, no emoji risk)
    if (! is_null($form_name)) {
      $result = wp_update_post([
        'ID'         => $form_id,
        'post_title' => sanitize_text_field($form_name),
      ], true);

      if (is_wp_error($result)) {
        return new WP_REST_Response(['message' => 'Failed to update form name.'], 500);
      }

      $has_update = true;
    }

    // Update content directly via $wpdb to preserve emoji
    if (! is_null($form_data)) {

      if (is_string($form_data)) {
        $decoded = json_decode($form_data, true);
        if (json_last_error() === JSON_ERROR_NONE) {
          $form_data = $decoded;
        }
      }

      if (! empty($form_data)) {
        $saved = $this->save_post_content($form_id, $this->encode_form_data($form_data));

        if (! $saved) {
          return new WP_REST_Response(['message' => 'Failed to save form content.'], 500);
        }

        $has_update = true;
      }
    }

    if (! $has_update) {
      return new WP_Error('no_update_data', __('No data provided to update.', 'wp-flowforms'), ['status' => 400]);
    }

    return new WP_REST_Response([
      'success' => true,
      'form_id' => $form_id,
      'message' => 'Form updated successfully.',
    ], 200);
  }

  /**
   * Encode form data to JSON preserving emoji and special characters.
   *
   * wp_json_encode() without flags escapes every non-ASCII codepoint to
   * \uXXXX sequences (e.g. 🙌 → \ud83d\ude4c). When wp_insert_post /
   * wp_update_post then run wp_slash() on the string, those backslashes get
   * doubled and the sequences become unreadable on the next json_decode().
   *
   * JSON_UNESCAPED_UNICODE stores emoji as literal UTF-8 bytes so slashing
   * can never corrupt them. JSON_UNESCAPED_SLASHES keeps the JSON compact.
   */
  private function encode_form_data(array $data)
  {
    return wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  }

  /**
   * Write post_content directly via $wpdb to bypass wp_insert_post /
   * wp_update_post's internal wp_slash() call, which would corrupt the
   * literal UTF-8 emoji characters we stored above.
   */
  private function save_post_content(int $post_id, string $json): bool
  {
    global $wpdb;

    $result = $wpdb->update(
      $wpdb->posts,
      ['post_content' => $json],
      ['ID'           => $post_id],
      ['%s'],
      ['%d']
    );

    if ($result !== false) {
      clean_post_cache($post_id);
    }

    return $result !== false;
  }

	/**
	 * Handle a form submission.
	 *
	 * Validates the nonce, runs server-side field validation, saves the
	 * entry to the custom database table, and returns a structured response.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_submission( WP_REST_Request $request ) {
		// ── Nonce check ───────────────────────────────────────────────────
		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_Error(
				'invalid_nonce',
				__( 'Security check failed.', 'wp-flowforms' ),
				[ 'status' => 403 ]
			);
		}

		// Load the form
		$form_id = absint( $request['id'] );
		$post    = get_post( $form_id );

		if ( ! $post || $post->post_type !== 'wpff_forms' || $post->post_status !== 'publish' ) {
			return new WP_Error(
				'form_not_found',
				__( 'Form not found.', 'wp-flowforms' ),
				[ 'status' => 404 ]
			);
		}

		$form_content = wpff_decode( $post->post_content );

		if ( empty( $form_content ) ) {
			return new WP_Error(
				'invalid_form',
				__( 'Form content could not be read.', 'wp-flowforms' ),
				[ 'status' => 500 ]
			);
		}

		// Validate answers
		$raw_answers = $request->get_param( 'answers' );
		$answers     = is_array( $raw_answers ) ? $raw_answers : [];
		$questions   = $form_content['questions'] ?? [];
		$errors      = [];

		foreach ( $questions as $question ) {
			$q_id    = $question['id'] ?? '';
			$type    = $question['type'] ?? '';
			$settings = $question['settings'] ?? [];
			$answer  = $answers[ $q_id ] ?? null;

			// Required check.
			if ( ! empty( $settings['required'] ) && $this->is_empty_answer( $answer, $type ) ) {
				$errors[ $q_id ] = __( 'This field is required.', 'wp-flowforms' );
				continue;
			}

			// Type-specific validation.
			$type_error = $this->validate_answer_type( $type, $answer, $settings );
			if ( $type_error ) {
				$errors[ $q_id ] = $type_error;
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_REST_Response( [ 'errors' => $errors ], 422 );
		}

		// Sanitize and save
		$sanitized = $this->sanitize_answers( $answers, $questions );
		$entry_id  = $this->save_entry( $form_id, $sanitized, $request );

		if ( ! $entry_id ) {
			return new WP_REST_Response(
				[ 'message' => __( 'Failed to save submission.', 'wp-flowforms' ) ],
				500
			);
		}

		/**
		 * Fires after a form submission is successfully saved.
		 *
		 * @since 1.1.0
		 *
		 * @param int   $entry_id      Inserted entry ID.
		 * @param int   $form_id       Form ID.
		 * @param array $sanitized     Sanitized answers.
		 * @param array $form_content  Full form content array.
		 */
		do_action( 'wpff_form_submitted', $entry_id, $form_id, $sanitized, $form_content );

		return new WP_REST_Response( [ 'success' => true, 'entry_id' => $entry_id ], 200 );
	}

	/**
	 * Returns true when an answer is considered empty for a given question type.
	 *
	 * @param mixed  $answer
	 * @param string $type
	 */
	private function is_empty_answer( $answer, string $type ): bool {
		if ( is_null( $answer ) ) {
			return true;
		}

		if ( is_array( $answer ) ) {
			return count( $answer ) === 0;
		}

		return trim( (string) $answer ) === '';
	}

	/**
	 * Type-specific server-side validation.
	 *
	 * Returns an error string or null on success.
	 *
	 * @param string $type
	 * @param mixed  $answer
	 * @param array  $settings
	 * @return string|null
	 */
	private function validate_answer_type( string $type, $answer, array $settings ): ?string {
		if ( $this->is_empty_answer( $answer, $type ) ) {
			return null; // Required already handled above; empty optional is fine.
		}

		switch ( $type ) {
			case 'email':
				if ( ! is_email( (string) $answer ) ) {
					return __( 'Please enter a valid email address.', 'wp-flowforms' );
				}
				break;

			case 'number':
				if ( ! is_numeric( $answer ) ) {
					return __( 'Please enter a valid number.', 'wp-flowforms' );
				}
				$num = (float) $answer;
				if ( isset( $settings['min'] ) && $num < (float) $settings['min'] ) {
					/* translators: %s: minimum value */
					return sprintf( __( 'Value must be at least %s.', 'wp-flowforms' ), $settings['min'] );
				}
				if ( isset( $settings['max'] ) && $num > (float) $settings['max'] ) {
					/* translators: %s: maximum value */
					return sprintf( __( 'Value must be at most %s.', 'wp-flowforms' ), $settings['max'] );
				}
				break;

			case 'rating':
				$steps = absint( $settings['steps'] ?? 5 );
				$val   = (int) $answer;
				if ( $val < 1 || $val > $steps ) {
					return __( 'Please select a valid rating.', 'wp-flowforms' );
				}
				break;

			case 'multiple_choice':
			case 'checkboxes':
				// Answers must be an array of strings.
				if ( ! is_array( $answer ) ) {
					return __( 'Invalid selection.', 'wp-flowforms' );
				}
				break;

			case 'yes_no':
				if ( ! in_array( $answer, [ 'yes', 'no' ], true ) ) {
					return __( 'Please select yes or no.', 'wp-flowforms' );
				}
				break;
		}

		return null;
	}

	/**
	 * Sanitize submitted answers to safe values for storage.
	 *
	 * @param array $answers   Raw submitted answers keyed by question ID.
	 * @param array $questions Form questions array.
	 * @return array
	 */
	private function sanitize_answers( array $answers, array $questions ): array {
		$clean = [];

		foreach ( $questions as $question ) {
			$q_id   = $question['id'] ?? '';
			$type   = $question['type'] ?? '';
			$answer = $answers[ $q_id ] ?? null;

			if ( is_null( $answer ) ) {
				$clean[ $q_id ] = null;
				continue;
			}

			switch ( $type ) {
				case 'email':
					$clean[ $q_id ] = sanitize_email( (string) $answer );
					break;

				case 'number':
				case 'rating':
					$clean[ $q_id ] = is_numeric( $answer ) ? $answer + 0 : 0;
					break;

				case 'multiple_choice':
				case 'checkboxes':
					$clean[ $q_id ] = is_array( $answer )
						? array_map( 'sanitize_text_field', $answer )
						: [];
					break;

				case 'yes_no':
					$clean[ $q_id ] = in_array( $answer, [ 'yes', 'no' ], true ) ? $answer : null;
					break;

				default:
					// short_text, long_text, etc.
					$clean[ $q_id ] = sanitize_textarea_field( (string) $answer );
					break;
			}
		}

		return $clean;
	}

	/**
	 * Insert a new entry row into the custom entries table.
	 *
	 * @param int             $form_id
	 * @param array           $sanitized_answers
	 * @param WP_REST_Request $request
	 * @return int|false Inserted row ID, or false on failure.
	 */
	private function save_entry( int $form_id, array $sanitized_answers, WP_REST_Request $request ) {
		global $wpdb;

		$table = $wpdb->prefix . 'flowforms_entries';

		$result = $wpdb->insert(
			$table,
			[
				'form_id'    => $form_id,
				'answers'    => wp_json_encode( $sanitized_answers, JSON_UNESCAPED_UNICODE ),
				'ip_address' => $this->get_ip_address( $request ),
				'user_agent' => sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ?? '' ),
				'created_at' => current_time( 'mysql' ),
			],
			[ '%d', '%s', '%s', '%s', '%s' ]
		);

		return $result !== false ? (int) $wpdb->insert_id : false;
	}

	/**
	 * Retrieve the client IP, respecting common proxy headers.
	 *
	 * @param WP_REST_Request $request
	 * @return string
	 */
	private function get_ip_address( WP_REST_Request $request ): string {
		$headers = [
			'HTTP_CF_CONNECTING_IP', // Cloudflare
			'HTTP_X_FORWARDED_FOR',
			'HTTP_X_REAL_IP',
			'REMOTE_ADDR',
		];

		foreach ( $headers as $header ) {
			if ( ! empty( $_SERVER[ $header ] ) ) {
				$ip = trim( explode( ',', $_SERVER[ $header ] )[0] );
				if ( filter_var( $ip, FILTER_VALIDATE_IP ) ) {
					return $ip;
				}
			}
		}

		return '';
	}  
}

new FlowForms_REST_API;
