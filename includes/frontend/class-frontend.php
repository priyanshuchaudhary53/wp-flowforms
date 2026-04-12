<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * FlowForms_Frontend
 *
 * Responsible for everything that touches the public-facing site:
 *
 *  - Registering the [flowform id="123"] shortcode
 *  - Conditionally enqueueing the renderer bundle (build/form/index.js)
 *    only on pages that actually contain a form
 *  - Registering the POST /forms/{id}/submit REST route
 *  - Handling the full-page embed URL  (/flowform/{id})
 *  - Handling the builder preview URL  (?flowform_preview=1&id=X&token=Y)
 *
 * @since 1.0.0
 */
class FlowForms_Frontend {

	/**
	 * Whether the renderer assets have already been enqueued for this request.
	 *
	 * @var bool
	 */
	private bool $assets_enqueued = false;

	/**
	 * Form IDs found on the current page (populated by shortcode / block).
	 *
	 * @var int[]
	 */
	private array $form_ids = [];

	/**
	 * Register the shortcode, asset enqueue hooks, rewrite rules, and template redirect handlers.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_shortcode( 'flowform', [ $this, 'render_shortcode' ] );

		// Scan queried post content for form IDs then enqueue if any are found.
		add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_assets' ], 20 );

		add_action( 'init', [ $this, 'register_rewrites' ] );
		add_action( 'template_redirect', [ $this, 'handle_full_page_embed' ] );
		add_action( 'template_redirect', [ $this, 'handle_preview' ] );
	}

	/**
	 * Render [flowform id="123"] shortcode.
	 *
	 * Outputs a placeholder div — the JS renderer boots into it on
	 * DOMContentLoaded. Registers the form ID so assets get enqueued.
	 *
	 * @param array $atts Shortcode attributes.
	 * @since 1.0.0
	 * @return string HTML output.
	 */
	public function render_shortcode( array $atts ): string {
		$atts = shortcode_atts( [
			'id'            => 0,
			'height'        => '520px',
			'border_radius' => '16px',
		], $atts, 'flowform' );

		$form_id       = absint( $atts['id'] );
		$height        = sanitize_text_field( $atts['height'] );
		$border_radius = sanitize_text_field( $atts['border_radius'] );

		if ( ! $form_id ) {
			return '<!-- FlowForms: missing id attribute -->';
		}

		$post = get_post( $form_id );

		if ( ! $post || $post->post_type !== 'flowforms_forms' ) {
			return '<!-- FlowForms: form not found -->';
		}

		if ( $post->post_status !== 'publish' ) {
			return $this->trashed_form_notice( $form_id );
		}

		$this->flag_form_id( $form_id );

		return $this->container_html( $form_id, false, $height, $border_radius );
	}

	/**
	 * Flag a form ID as present on this page.
	 * Called by both the shortcode and the Gutenberg block render callback.
	 *
	 * @param int $form_id
	 * @since 1.0.0
	 */
	public function flag_form_id( int $form_id ): void {
		if ( $form_id && ! in_array( $form_id, $this->form_ids, true ) ) {
			$this->form_ids[] = $form_id;
		}
	}

	/**
	 * Enqueue the renderer bundle — but only if at least one form is present.
	 *
	 * Hooked to wp_enqueue_scripts at priority 20. Proactively scans the queried
	 * post's content for shortcodes and blocks so assets are enqueued even when
	 * wp_enqueue_scripts fires before the content loop (the normal WordPress flow).
	 *
	 * @since 1.0.0
	 */
	public function maybe_enqueue_assets(): void {
		// Full-page embed and preview requests.
		$query_form_id = absint( get_query_var( 'flowform_id', 0 ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing params; preview token is validated separately.
		$preview_id    = absint( $_GET['id'] ?? 0 );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only routing param; no state change occurs from reading this.
		$is_preview    = ! empty( $_GET['flowform_preview'] );

		if ( $query_form_id ) {
			$this->flag_form_id( $query_form_id );
		}

		if ( $is_preview && $preview_id ) {
			$this->flag_form_id( $preview_id );
		}

		// Proactively scan the current post/page content so we don't rely on
		// shortcodes having already rendered (they haven't at wp_enqueue_scripts time).
		$this->scan_queried_object_for_forms();

		if ( empty( $this->form_ids ) ) {
			return;
		}

		$this->enqueue_renderer_assets();
	}

	/**
	 * Scan the current queried post's stored content for [flowform] shortcodes
	 * and wp:flowforms/form block comments, and flag any form IDs found.
	 *
	 * This runs before the content loop so that wp_enqueue_scripts can enqueue
	 * assets even when shortcodes have not yet been processed.
	 *
	 * @since 1.0.0
	 */
	private function scan_queried_object_for_forms(): void {
		$post = get_queried_object();

		if ( ! $post instanceof WP_Post || empty( $post->post_content ) ) {
			return;
		}

		// [flowform id="123"] or [flowform id='123'] or [flowform id=123]
		if ( preg_match_all( '/\[flowform\b[^\]]*\bid=["\']?(\d+)/i', $post->post_content, $matches ) ) {
			foreach ( $matches[1] as $id ) {
				$this->flag_form_id( (int) $id );
			}
		}

		// <!-- wp:flowforms/form {"formId":123} -->
		if ( preg_match_all( '/<!--\s*wp:flowforms\/form\s*(\{[^}]+\})/i', $post->post_content, $matches ) ) {
			foreach ( $matches[1] as $attrs_json ) {
				$attrs = json_decode( $attrs_json, true );
				if ( ! empty( $attrs['formId'] ) ) {
					$this->flag_form_id( (int) $attrs['formId'] );
				}
			}
		}
	}

	/**
	 * Enqueue the compiled form renderer bundle.
	 * @since 1.0.0
	 */
	private function enqueue_renderer_assets(): void {
		if ( $this->assets_enqueued ) {
			return;
		}

		$asset_file = FLOWFORMS_PATH . 'build/form/index.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: [ 'dependencies' => [], 'version' => FLOWFORMS_VERSION ];

		wp_enqueue_script(
			'flowform-renderer',
			FLOWFORMS_URL . 'build/form/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'flowform-renderer', 'flowforms', FLOWFORMS_PATH . 'languages' );

		wp_enqueue_style(
			'flowform-renderer',
			FLOWFORMS_URL . 'build/form/style-index.css',
			[],
			$asset['version']
		);

		// Register per-form design tokens as inline CSS on the renderer stylesheet,
		// so they arrive in <head> before content renders (avoids raw <style> in body).
		foreach ( $this->form_ids as $form_id ) {
			if ( ! $form_id ) {
				continue;
			}
			$design   = $this->get_form_design( $form_id );
			$selector = sprintf( '[data-flowform-id="%d"]', absint( $form_id ) );
			$css      = sprintf(
				'%s{background-color:%s;--btn-color:%s;--hint-color:%s;}',
				$selector,
				esc_attr( $design['bg_color']     ?? '#ffffff' ),
				esc_attr( $design['button_color'] ?? '#111827' ),
				esc_attr( $design['hint_color']   ?? '#9ca3af' )
			);
			wp_add_inline_style( 'flowform-renderer', $css );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Preview flag is a read-only routing param; token is validated separately by verify_preview_token().
		$is_preview  = ! empty( $_GET['flowform_preview'] );
		$preview_ok  = $is_preview && $this->verify_preview_token( sanitize_text_field( wp_unslash( $_GET['token'] ?? '' ) ) );

		$hp_labels = [ 'Name', 'Email', 'Phone', 'Website', 'Comment', 'Message' ];

		wp_localize_script( 'flowform-renderer', 'flowformPublicData', [
			'apiUrl'      => rest_url( 'flowforms/v1' ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'previewMode' => $preview_ok,
			'formIds'     => $this->form_ids,
			'honeypot'    => [
				'field_name' => 'flowforms_hp',
				'label'      => $hp_labels[ array_rand( $hp_labels ) ],
			],
			'i18n'        => [
				// Error and Validation Messages
				'required'          => flowforms_get_setting( 'validation-required',           __( 'This field is required.', 'flowforms' ) ),
				'email'             => flowforms_get_setting( 'validation-email',              __( 'Please enter a valid email address.', 'flowforms' ) ),
				'emailMismatch'     => flowforms_get_setting( 'validation-email-mismatch',     __( 'Email addresses do not match.', 'flowforms' ) ),
				'number'            => flowforms_get_setting( 'validation-number',             __( 'Please enter a valid number.', 'flowforms' ) ),
				'numberMin'         => flowforms_get_setting( 'validation-number-min',         __( 'Value must be at least {min}.', 'flowforms' ) ),
				'numberMax'         => flowforms_get_setting( 'validation-number-max',         __( 'Value must be at most {max}.', 'flowforms' ) ),
				'maxlength'         => flowforms_get_setting( 'validation-maxlength',          __( 'Please enter no more than {limit} characters.', 'flowforms' ) ),
				'rating'            => flowforms_get_setting( 'validation-rating',             __( 'Please select a valid rating.', 'flowforms' ) ),
				'selection'         => flowforms_get_setting( 'validation-selection',          __( 'Please make a selection.', 'flowforms' ) ),
				'checkboxesMin'     => flowforms_get_setting( 'validation-checkboxes-min',     __( 'Please select at least {count} options.', 'flowforms' ) ),
				'checkboxesMax'     => flowforms_get_setting( 'validation-checkboxes-max',     __( 'Please select at most {count} options.', 'flowforms' ) ),
				'yesNo'             => flowforms_get_setting( 'validation-yesno',              __( 'Please select yes or no.', 'flowforms' ) ),
				'submissionFailed'  => flowforms_get_setting( 'form-submission-failed',        __( 'Submission failed', 'flowforms' ) ),
				'error'             => flowforms_get_setting( 'form-error-message',            __( 'Something went wrong. Please try again.', 'flowforms' ) ),
				'spam'              => flowforms_get_setting( 'form-spam-message',             __( 'Your submission could not be processed. Please reload the page and try again.', 'flowforms' ) ),
				'loadError'         => flowforms_get_setting( 'form-load-error',               __( 'Sorry, this form could not be loaded. Please try again later.', 'flowforms' ) ),
				// Buttons, Labels and Hints
				'submit'            => flowforms_get_setting( 'form-submit-label',             __( 'Submit', 'flowforms' ) ),
				'submitting'        => flowforms_get_setting( 'form-submitting-label',         __( 'Submitting...', 'flowforms' ) ),
				'start'             => flowforms_get_setting( 'form-start-label',              __( 'Start', 'flowforms' ) ),
				'ok'                => flowforms_get_setting( 'form-ok-label',                 __( 'OK', 'flowforms' ) ),
				'tryAgain'          => flowforms_get_setting( 'form-try-again-label',          __( 'Try again', 'flowforms' ) ),
				'enterHint'         => flowforms_get_setting( 'form-enter-hint',               __( 'press Enter ↵', 'flowforms' ) ),
				'shiftEnterHint'    => flowforms_get_setting( 'form-shift-enter-hint',        	__( 'Shift ⇧ + Enter ↵ to make a line break', 'flowforms' ) ),
				'previous'          => flowforms_get_setting( 'nav-previous-label',            __( 'Previous', 'flowforms' ) ),
				'next'              => flowforms_get_setting( 'nav-next-label',                __( 'Next', 'flowforms' ) ),
				'thankYou'          => flowforms_get_setting( 'form-thankyou-title',           __( 'Thank you!', 'flowforms' ) ),
				'loading'           => flowforms_get_setting( 'form-loading',                  __( 'Loading form…', 'flowforms' ) ),
				'redirectingIn'     => flowforms_get_setting( 'form-redirecting-in',           __( 'Redirecting in {seconds}…', 'flowforms' ) ),
				'redirecting'       => flowforms_get_setting( 'form-redirecting',              __( 'Redirecting…', 'flowforms' ) ),
				'textPlaceholder'   => flowforms_get_setting( 'input-text-placeholder',        __( 'Your answer here…', 'flowforms' ) ),
				'emailPlaceholder'  => flowforms_get_setting( 'input-email-placeholder',       __( 'name@example.com', 'flowforms' ) ),
				'confirmEmailLabel' => flowforms_get_setting( 'input-confirm-email-label',     __( 'Confirm email', 'flowforms' ) ),
				'confirmEmailPlaceholder' => flowforms_get_setting( 'input-confirm-email-placeholder', __( 'Confirm your email', 'flowforms' ) ),
				'otherLabel'        => flowforms_get_setting( 'input-other-label',             __( 'Other', 'flowforms' ) ),
				'otherPlaceholder'  => flowforms_get_setting( 'input-other-placeholder',       __( 'Type your answer…', 'flowforms' ) ),
				'otherConfirm'      => flowforms_get_setting( 'input-other-confirm',           __( 'Confirm', 'flowforms' ) ),
				'ratingLabel'       => flowforms_get_setting( 'input-rating-label',            __( 'Rate {value} out of {max}', 'flowforms' ) ),
				'yes'               => flowforms_get_setting( 'input-yes-label',               __( 'Yes', 'flowforms' ) ),
				'no'                => flowforms_get_setting( 'input-no-label',                __( 'No', 'flowforms' ) ),
				'shareLabel'        => flowforms_get_setting( 'form-share-label',              __( 'Share this form', 'flowforms' ) ),
				'shareOn'           => flowforms_get_setting( 'form-share-on',                 __( 'Share on {network}', 'flowforms' ) ),
				'shareTitle'        => flowforms_get_setting( 'form-share-title',              __( 'Check this out!', 'flowforms' ) ),
			],
		] );

		$this->assets_enqueued = true;
	}

	/**
	 * Register the /flowform/{id} rewrite rule.
	 *
	 * Maps pretty URL to a query var the template_redirect hook picks up.
	 * @since 1.0.0
	 */
	public function register_rewrites(): void {
		add_rewrite_rule(
			'^flowform/(\d+)/?$',
			'index.php?flowform_id=$matches[1]',
			'top'
		);

		add_rewrite_tag( '%flowform_id%', '(\d+)' );
	}

	/**
	 * Output a bare full-page form embed — no theme header/footer.
	 *
	 * Triggered when the /flowform/{id} URL is visited.
	 * @since 1.0.0
	 */
	public function handle_full_page_embed(): void {
		$form_id = absint( get_query_var( 'flowform_id', 0 ) );

		if ( ! $form_id ) {
			return;
		}

		$post = get_post( $form_id );

		// Form doesn't exist at all — generic 404 for everyone.
		if ( ! $post || $post->post_type !== 'flowforms_forms' ) {
			$this->render_form_unavailable_page();
			exit;
		}

		// Form is in the trash.
		if ( $post->post_status === 'trash' ) {
			if ( current_user_can( 'edit_posts' ) ) {
				$restore_url = wp_nonce_url(
					add_query_arg(
						[ 'page' => 'flowforms_forms', 'action' => 'restore', 'form_id' => $form_id, 'status' => 'trash' ],
						admin_url( 'admin.php' )
					),
					'flowforms_restore_form_nonce'
				);
				$this->render_form_trashed_page( $post->post_title, $restore_url );
			} else {
				$this->render_form_unavailable_page();
			}
			exit;
		}

		// Form exists but has never been published — content.published slot is null.
		$decoded   = flowforms_decode( $post->post_content );
		$published = is_array( $decoded ) && isset( $decoded['content']['published'] )
			? $decoded['content']['published']
			: null;

		if ( empty( $published ) ) {
			if ( current_user_can( 'edit_posts' ) ) {
				$builder_url = wp_nonce_url( admin_url( 'admin.php?page=flowforms_form_builder&form_id=' . $form_id ), 'flowforms_builder_nav' );
				$this->render_form_not_published_page( $post->post_title, $builder_url );
			} else {
				$this->render_form_unavailable_page();
			}
			exit;
		}

		$this->flag_form_id( $form_id );
		$this->enqueue_renderer_assets();
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Intentionally firing the core WP hook to trigger registered enqueue callbacks.
		do_action( 'wp_enqueue_scripts' );

		$this->render_full_page( $form_id, $post->post_title );
		exit;
	}

	/**
	 * Handle the builder preview URL: ?flowform_preview=1&id=X&token=Y
	 *
	 * Serves the same bare page but with previewMode:true injected into JS.
	 * @since 1.0.0
	 */
	public function handle_preview(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Routing check only; nonce is verified on the next line via wp_verify_nonce().
		if ( empty( $_GET['flowform_preview'] ) ) {
			return;
		}

		// Verify the preview nonce token — this protects all subsequent $_GET reads.
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['token'] ?? '' ) ), 'flowform_preview' ) ) {
			wp_die(
				esc_html__( 'Preview link is invalid or has expired.', 'flowforms' ),
				esc_html__( 'Invalid Preview', 'flowforms' ),
				[ 'response' => 403 ]
			);
		}

		// Must be logged in to preview.
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die(
				esc_html__( 'You do not have permission to preview forms.', 'flowforms' ),
				esc_html__( 'Permission Denied', 'flowforms' ),
				[ 'response' => 403 ]
			);
		}

		// Nonce verified above — read remaining params.
		$transient_key = sanitize_key( $_GET['template_preview_key'] ?? '' );

		if ( $transient_key ) {
			$template = get_transient( $transient_key );

			if ( ! $template || ! is_array( $template ) ) {
				wp_die(
					esc_html__( 'Template preview has expired. Please try again.', 'flowforms' ),
					esc_html__( 'Preview Expired', 'flowforms' ),
					[ 'response' => 410 ]
				);
			}

			$this->render_template_preview_page( $template );
			exit;
		}

		// Regular form preview — nonce verified above.
		$form_id = absint( $_GET['id'] ?? 0 );

		if ( ! $form_id ) {
			wp_die(
				esc_html__( 'Preview link is invalid or has expired.', 'flowforms' ),
				esc_html__( 'Invalid Preview', 'flowforms' ),
				[ 'response' => 403 ]
			);
		}

		$post = get_post( $form_id );

		if ( ! $post || $post->post_type !== 'flowforms_forms' ) {
			wp_die(
				esc_html__( 'Form not found.', 'flowforms' ),
				esc_html__( 'Form Not Found', 'flowforms' ),
				[ 'response' => 404 ]
			);
		}

		// Assets — previewMode flag is set inside maybe_enqueue_assets() which
		// reads $_GET['flowform_preview'] and verifies the token.
		$this->flag_form_id( $form_id );
		$this->enqueue_renderer_assets();
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Intentionally firing the core WP hook to trigger registered enqueue callbacks.
		do_action( 'wp_enqueue_scripts' );

		$this->render_full_page( $form_id, $post->post_title, true );
		exit;
	}

	/**
	 * Render a full-page template preview without a real form post.
	 * Creates a synthetic form ID (0) and injects content via JS.
	 *
	 * @param array $content Template form content array.
	 * @since 1.0.0
	 */
	private function render_template_preview_page( array $template ): void {
		show_admin_bar( false );

		$design  = is_array( $template['design'] ?? null ) ? $template['design'] : [];
		$content = $template['content'] ?? [];

		$bg   = esc_attr( $design['bg_color']     ?? '#ffffff' );
		$btn  = esc_attr( $design['button_color'] ?? '#111827' );
		$hint = esc_attr( $design['hint_color']   ?? '#9ca3af' );

		$asset_file = FLOWFORMS_PATH . 'build/form/index.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: [ 'dependencies' => [], 'version' => FLOWFORMS_VERSION ];

		wp_enqueue_script( 'flowform-renderer', FLOWFORMS_URL . 'build/form/index.js', $asset['dependencies'], $asset['version'], true );
		wp_set_script_translations( 'flowform-renderer', 'flowforms', FLOWFORMS_PATH . 'languages' );
		wp_enqueue_style( 'flowform-renderer', FLOWFORMS_URL . 'build/form/style-index.css', [], $asset['version'] );

		// Pass content and design separately — FormApp expects design at the top
		// level of formData, not nested inside content.
		wp_localize_script( 'flowform-renderer', 'flowformPublicData', [
			'apiUrl'          => rest_url( 'flowforms/v1' ),
			'nonce'           => wp_create_nonce( 'wp_rest' ),
			'previewMode'     => true,
			'formIds'         => [],
			'templatePreview' => true,
			'templateContent' => $content,
			'templateDesign'  => $design,
		] );

		wp_add_inline_style( 'flowform-renderer', sprintf(
			'html,body{margin:0 !important;padding:0 !important;height:100%%;overflow:hidden;background:%1$s;}html{margin-top:0 !important;}#flowform-full-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;background-color:%1$s;--btn-color:%2$s;--hint-color:%3$s;}',
			$bg,
			$btn,
			$hint
		) );

		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Intentionally firing the core WP hook to trigger registered enqueue callbacks.
		do_action( 'wp_enqueue_scripts' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php esc_html_e( 'Template Preview', 'flowforms' ); ?></title>
<?php wp_head(); ?>
</head>
<body>
<div id="flowform-full-page">
	<div class="flowform-container" data-flowform-id="0" data-ff-mode="fullpage" data-ff-template-preview="true"></div>
</div>
<?php wp_footer(); ?>
</body>
</html>
		<?php
	}

	/**
	 * Output the minimal HTML shell for full-page / preview rendering.
	 *
	 * When $is_preview is true the WP admin bar is suppressed so it does not
	 * appear inside the builder's preview iframe.  Validation is skipped
	 * automatically because previewMode:true is injected into flowformPublicData
	 * by enqueue_renderer_assets() — no in-page toggle bar is needed.
	 *
	 * @param int    $form_id
	 * @param string $title      Escaped page title.
	 * @param bool   $is_preview True when rendered inside the builder preview iframe.
	 * @since 1.0.0
	 */
	private function render_full_page( int $form_id, string $title, bool $is_preview = false ): void {
		if ( $is_preview ) {
			show_admin_bar( false );
		}

		$design = $this->get_form_design( $form_id );
		$bg     = esc_attr( $design['bg_color']     ?? '#ffffff' );
		$btn    = esc_attr( $design['button_color'] ?? '#111827' );
		$hint   = esc_attr( $design['hint_color']   ?? '#9ca3af' );

		wp_add_inline_style( 'flowform-renderer', sprintf(
			'html,body{margin:0 !important;padding:0 !important;height:100%%;overflow:hidden;background:%1$s;}html{margin-top:0 !important;}#flowform-full-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 16px;position:relative;z-index:99999;background-color:%1$s;--btn-color:%2$s;--hint-color:%3$s;}',
			$bg,
			$btn,
			$hint
		) );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php echo esc_html( $title ); ?></title>
<?php wp_head(); ?>
</head>
<body>
<div id="flowform-full-page">
	<?php echo wp_kses( $this->container_html( $form_id, true ), flowforms_kses_form_container() ); ?>
</div>

<?php wp_footer(); ?>
</body>
</html>
		<?php
	}

	/**
	 * Generate a signed preview token for a given user session.
	 *
	 * The token is a short-lived nonce scoped to the flowform_preview action.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public static function generate_preview_token(): string {
		return wp_create_nonce( 'flowform_preview' );
	}

	/**
	 * Verify a preview token.
	 *
	 * @param string $token
	 * @since 1.0.0
	 * @return bool
	 */
	private function verify_preview_token( string $token ): bool {
		return (bool) wp_verify_nonce( $token, 'flowform_preview' );
	}

	/**
	 * Read the design object from a form's published slot, merged with defaults.
	 *
	 * @param  int   $form_id
	 * @since 1.0.0
	 * @return array
	 */
	private function get_form_design( int $form_id ): array {
		$defaults = [
			'bg_color'     => '#ffffff',
			'button_color' => '#111827',
			'hint_color'   => '#9ca3af',
		];

		$post = get_post( $form_id );
		if ( ! $post ) return $defaults;

		$decoded = flowforms_decode( $post->post_content );
		if ( ! is_array( $decoded ) ) return $defaults;

		$design = $decoded['design'] ?? [];

		return array_merge( $defaults, array_filter( $design, fn( $v ) => $v !== '' && $v !== null ) );
	}

	/**
	 * Return the container div HTML used by every embed method.
	 *
	 * @param int    $form_id
	 * @param bool   $fullpage       When true, adds data-ff-mode="fullpage".
	 *                               Fullpage ignores height/border-radius (CSS handles it).
	 * @param string $height         CSS min-height value (e.g. "520px", "80vh").
	 * @param string $border_radius  CSS border-radius value (e.g. "16px").
	 * @since 1.0.0
	 * @return string
	 */
	public function container_html(
		int    $form_id,
		bool   $fullpage      = false,
		string $height        = '520px',
		string $border_radius = '16px'
	): string {
		if ( $fullpage ) {
			return sprintf(
				'<div class="flowform-container" data-flowform-id="%d" data-ff-mode="fullpage"></div>',
				$form_id
			);
		}

		$inline_style = sprintf(
			'min-height:%s;border-radius:%s;',
			esc_attr( $height ),
			esc_attr( $border_radius )
		);

		return sprintf(
			'<div class="flowform-container" data-flowform-id="%d" style="%s"></div>',
			$form_id,
			$inline_style
		);
	}

	/**
	 * Return the trashed-form notice HTML.
	 *
	 * Admins see an inline notice with a restore link.
	 * Regular visitors see nothing (empty string).
	 *
	 * @param int $form_id
	 * @since 1.0.0
	 * @return string
	 */
	public function trashed_form_notice( int $form_id ): string {
		if ( ! current_user_can( 'manage_options' ) ) {
			return '';
		}

		$restore_url = wp_nonce_url(
			add_query_arg(
				[ 'page' => 'flowforms_forms', 'action' => 'restore', 'form_id' => $form_id, 'status' => 'trash' ],
				admin_url( 'admin.php' )
			),
			'flowforms_restore_form_nonce'
		);

		$post  = get_post( $form_id );
		/* translators: %d: form ID */
	$label = $post ? $post->post_title : sprintf( __( 'Form #%d', 'flowforms' ), $form_id );

		ob_start();
		?>
		<div class="wpff-trashed-notice" style="
			display:flex;align-items:flex-start;gap:10px;
			background:#fff8e1;border-left:4px solid #f0b429;
			padding:14px 16px;font-family:inherit;
			font-size:13px;line-height:1.5;
			box-sizing:border-box;max-width:100%;
		">
			<span style="font-size:18px;line-height:1;flex-shrink:0;">⚠️</span>
			<span>
				<strong><?php echo esc_html( $label ); ?></strong>
				<?php esc_html_e( 'is in the Trash and is not visible to visitors.', 'flowforms' ); ?>
				&nbsp;<a href="<?php echo esc_url( $restore_url ); ?>"
					style="color:#92400e;text-decoration:underline;font-weight:600;white-space:nowrap;">
					<?php esc_html_e( 'Restore form', 'flowforms' ); ?>
				</a>
			</span>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render a minimal standalone HTML page for trashed forms.
	 * Only shown to logged-in admins/editors — includes a restore link.
	 *
	 * @param string $form_title  The form's post title.
	 * @param string $restore_url Nonce-signed URL to restore the form from trash.
	 * @since 1.0.0
	 */
	private function render_form_trashed_page( string $form_title, string $restore_url ): void {
		status_header( 404 );
		header( 'Content-Type: text/html; charset=utf-8' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php esc_html_e( 'Form In Trash', 'flowforms' ); ?></title>
<?php $this->print_standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--amber">🗑️</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form is in the trash.', 'flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php
			printf(
				/* translators: %s: form name */
				esc_html__( '"%s" has been moved to the trash and is not visible to visitors. Restore it to make it available again.', 'flowforms' ),
				esc_html( $form_title )
			);
		?>
	</p>
	<a href="<?php echo esc_url( $restore_url ); ?>" class="wpff-standalone__btn">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
		</svg>
		<?php esc_html_e( 'Restore Form', 'flowforms' ); ?>
	</a>
</div>
</body>
</html>
		<?php
	}

	/**
	 * Print the stylesheet for standalone unavailable/not-published pages via the WP enqueue API.
	 *
	 * Registers a static CSS file and prints it immediately (these pages do not
	 * call wp_head(), so we invoke wp_print_styles() directly).
	 *
	 * @since 1.0.0
	 */
	private function print_standalone_page_styles(): void {
		wp_register_style( 'wpff-standalone', FLOWFORMS_URL . 'assets/css/wpff-standalone.css', [], FLOWFORMS_VERSION );
		wp_print_styles( array( 'wpff-standalone' ) );
	}

	/**
	 * Render a minimal standalone HTML page for unavailable (missing/trashed) forms.
	 * Sets a 404 response code. Shown to non-admin users for any unservable form.
	 * @since 1.0.0
	 */
	private function render_form_unavailable_page(): void {
		status_header( 404 );
		header( 'Content-Type: text/html; charset=utf-8' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php esc_html_e( 'Form Not Available', 'flowforms' ); ?></title>
<?php $this->print_standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--grey">📋</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form is no longer available.', 'flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php esc_html_e( 'The form you are looking for has been removed or is currently unavailable.', 'flowforms' ); ?>
	</p>
</div>
</body>
</html>
		<?php
	}

	/**
	 * Render a minimal standalone HTML page for forms that exist but aren't published yet.
	 * Only shown to logged-in admins/editors — includes a link to the builder.
	 *
	 * @param string $form_title  The form's post title.
	 * @param string $builder_url URL to the form's builder page.
	 * @since 1.0.0
	 */
	private function render_form_not_published_page( string $form_title, string $builder_url ): void {
		status_header( 404 );
		header( 'Content-Type: text/html; charset=utf-8' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php esc_html_e( 'Form Not Published', 'flowforms' ); ?></title>
<?php $this->print_standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--amber">🚧</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form hasn\'t been published yet.', 'flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php
			printf(
				/* translators: %s: form name */
				esc_html__( '"%s" is not live yet. Publish it from the builder so visitors can fill it out.', 'flowforms' ),
				esc_html( $form_title )
			);
		?>
	</p>
	<a href="<?php echo esc_url( $builder_url ); ?>" class="wpff-standalone__btn">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
		</svg>
		<?php esc_html_e( 'Open in Builder', 'flowforms' ); ?>
	</a>
</div>
</body>
</html>
		<?php
	}

	/**
	 * Get the public shareable URL for a given form.
	 *
	 * Returns the pretty /flowform/{id} URL when pretty permalinks are enabled,
	 * otherwise falls back to a query-string URL.
	 *
	 * @param int $form_id
	 * @since 1.0.0
	 * @return string
	 */
	public static function get_public_url( int $form_id ): string {
		if ( get_option( 'permalink_structure' ) ) {
			return trailingslashit( home_url( 'flowform/' . $form_id ) );
		}

		return add_query_arg( 'flowform_id', $form_id, home_url( '/' ) );
	}

	/**
	 * Get the builder preview URL for a given form.
	 *
	 * This URL is used by the React builder's PreviewModal iframe src.
	 *
	 * @param int $form_id
	 * @since 1.0.0
	 * @return string
	 */
	public static function get_preview_url( int $form_id ): string {
		return add_query_arg(
			[
				'flowform_preview' => '1',
				'id'               => $form_id,
				'token'            => self::generate_preview_token(),
			],
			home_url( '/' )
		);
	}
}
