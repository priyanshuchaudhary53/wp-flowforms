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

		// Enqueue assets after the shortcode / block has had a chance to flag
		// which form IDs are on the page.
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

		if ( ! $post || $post->post_type !== 'wpff_forms' ) {
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
	 * Hooked to wp_enqueue_scripts at priority 20, so shortcodes at priority 10
	 * have already run and registered their form IDs.
	 * @since 1.0.0
	 */
	public function maybe_enqueue_assets(): void {
		// Also trigger for full-page embed and preview requests.
		$query_form_id = absint( get_query_var( 'flowform_id', 0 ) );
		$preview_id    = absint( $_GET['id'] ?? 0 );
		$is_preview    = ! empty( $_GET['flowform_preview'] );

		if ( $query_form_id ) {
			$this->flag_form_id( $query_form_id );
		}

		if ( $is_preview && $preview_id ) {
			$this->flag_form_id( $preview_id );
		}

		if ( empty( $this->form_ids ) ) {
			return;
		}

		$this->enqueue_renderer_assets();
	}

	/**
	 * Enqueue the compiled form renderer bundle.
	 * @since 1.0.0
	 */
	private function enqueue_renderer_assets(): void {
		if ( $this->assets_enqueued ) {
			return;
		}

		$asset_file = WP_FLOWFORMS_PATH . 'build/form/index.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: [ 'dependencies' => [], 'version' => WP_FLOWFORMS_VERSION ];

		wp_enqueue_script(
			'flowform-renderer',
			WP_FLOWFORMS_URL . 'build/form/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'flowform-renderer',
			WP_FLOWFORMS_URL . 'build/form/style-index.css',
			[],
			$asset['version']
		);

		$is_preview  = ! empty( $_GET['flowform_preview'] );
		$preview_ok  = $is_preview && $this->verify_preview_token( $_GET['token'] ?? '' );

		$hp_labels = [ 'Name', 'Email', 'Phone', 'Website', 'Comment', 'Message' ];

		wp_localize_script( 'flowform-renderer', 'flowformPublicData', [
			'apiUrl'      => rest_url( 'formflow/v1' ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'previewMode' => $preview_ok,
			'formIds'     => $this->form_ids,
			'honeypot'    => [
				'field_name' => 'wpff_hp',
				'label'      => $hp_labels[ array_rand( $hp_labels ) ],
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
		if ( ! $post || $post->post_type !== 'wpff_forms' ) {
			$this->render_form_unavailable_page();
			exit;
		}

		// Form is in the trash.
		if ( $post->post_status === 'trash' ) {
			if ( current_user_can( 'edit_posts' ) ) {
				$restore_url = wp_nonce_url(
					add_query_arg(
						[ 'page' => 'wpff_forms', 'action' => 'restore', 'form_id' => $form_id, 'status' => 'trash' ],
						admin_url( 'admin.php' )
					),
					'wpff_restore_form_nonce'
				);
				$this->render_form_trashed_page( $post->post_title, $restore_url );
			} else {
				$this->render_form_unavailable_page();
			}
			exit;
		}

		// Form exists but has never been published — content.published slot is null.
		$decoded   = wpff_decode( $post->post_content );
		$published = is_array( $decoded ) && isset( $decoded['content']['published'] )
			? $decoded['content']['published']
			: null;

		if ( empty( $published ) ) {
			if ( current_user_can( 'edit_posts' ) ) {
				$builder_url = admin_url( 'admin.php?page=wpff_form_builder&form_id=' . $form_id );
				$this->render_form_not_published_page( $post->post_title, $builder_url );
			} else {
				$this->render_form_unavailable_page();
			}
			exit;
		}

		$this->flag_form_id( $form_id );
		$this->enqueue_renderer_assets();
		do_action( 'wp_enqueue_scripts' );

		$this->render_full_page( $form_id, esc_html( $post->post_title ) );
		exit;
	}

	/**
	 * Handle the builder preview URL: ?flowform_preview=1&id=X&token=Y
	 *
	 * Serves the same bare page but with previewMode:true injected into JS.
	 * @since 1.0.0
	 */
	public function handle_preview(): void {
		if ( empty( $_GET['flowform_preview'] ) ) {
			return;
		}

		$token = sanitize_text_field( $_GET['token'] ?? '' );

		if ( ! $this->verify_preview_token( $token ) ) {
			wp_die(
				esc_html__( 'Preview link is invalid or has expired.', 'wp-flowforms' ),
				esc_html__( 'Invalid Preview', 'wp-flowforms' ),
				[ 'response' => 403 ]
			);
		}

		// Must be logged in to preview.
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die(
				esc_html__( 'You do not have permission to preview forms.', 'wp-flowforms' ),
				esc_html__( 'Permission Denied', 'wp-flowforms' ),
				[ 'response' => 403 ]
			);
		}

		// Template preview (no real post)
		$transient_key = sanitize_key( $_GET['template_preview_key'] ?? '' );

		if ( $transient_key ) {
			$template = get_transient( $transient_key );

			if ( ! $template || ! is_array( $template ) ) {
				wp_die(
					esc_html__( 'Template preview has expired. Please try again.', 'wp-flowforms' ),
					esc_html__( 'Preview Expired', 'wp-flowforms' ),
					[ 'response' => 410 ]
				);
			}

			$this->render_template_preview_page( $template );
			exit;
		}

		// Regular form preview
		$form_id = absint( $_GET['id'] ?? 0 );

		if ( ! $form_id ) {
			wp_die(
				esc_html__( 'Preview link is invalid or has expired.', 'wp-flowforms' ),
				esc_html__( 'Invalid Preview', 'wp-flowforms' ),
				[ 'response' => 403 ]
			);
		}

		$post = get_post( $form_id );

		if ( ! $post || $post->post_type !== 'wpff_forms' ) {
			wp_die(
				esc_html__( 'Form not found.', 'wp-flowforms' ),
				esc_html__( 'Form Not Found', 'wp-flowforms' ),
				[ 'response' => 404 ]
			);
		}

		// Assets — previewMode flag is set inside maybe_enqueue_assets() which
		// reads $_GET['flowform_preview'] and verifies the token.
		$this->flag_form_id( $form_id );
		$this->enqueue_renderer_assets();
		do_action( 'wp_enqueue_scripts' );

		$this->render_full_page( $form_id, esc_html( $post->post_title ), true );
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

		$asset_file = WP_FLOWFORMS_PATH . 'build/form/index.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: [ 'dependencies' => [], 'version' => WP_FLOWFORMS_VERSION ];

		wp_enqueue_script( 'flowform-renderer', WP_FLOWFORMS_URL . 'build/form/index.js', $asset['dependencies'], $asset['version'], true );
		wp_enqueue_style( 'flowform-renderer', WP_FLOWFORMS_URL . 'build/form/style-index.css', [], $asset['version'] );

		// Pass content and design separately — FormApp expects design at the top
		// level of formData, not nested inside content.
		wp_localize_script( 'flowform-renderer', 'flowformPublicData', [
			'apiUrl'          => rest_url( 'formflow/v1' ),
			'nonce'           => wp_create_nonce( 'wp_rest' ),
			'previewMode'     => true,
			'formIds'         => [],
			'templatePreview' => true,
			'templateContent' => $content,
			'templateDesign'  => $design,
		] );

		do_action( 'wp_enqueue_scripts' );
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php esc_html_e( 'Template Preview', 'wp-flowforms' ); ?></title>
<?php wp_head(); ?>
<style>
html, body { margin: 0 !important; padding: 0 !important; height: 100%; overflow: hidden; background: <?php echo $bg; ?>; }
html { margin-top: 0 !important; }
#flowform-full-page {
	min-height: 100vh; display: flex; align-items: center; justify-content: center;
	padding: 32px 16px; background-color: <?php echo $bg; ?>;
	--btn-color: <?php echo $btn; ?>; --hint-color: <?php echo $hint; ?>;
}
</style>
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
		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?php echo $title; ?></title>
<?php wp_head(); ?>
<style>
html, body {
	margin: 0 !important;
	padding: 0 !important;
	height: 100%;
	overflow: hidden;
	background: <?php echo $bg; ?>;
}
html { margin-top: 0 !important; }
#flowform-full-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px 16px;
	position: relative;
	z-index: 99999;
	background-color: <?php echo $bg; ?>;
	--btn-color: <?php echo $btn; ?>;
	--hint-color: <?php echo $hint; ?>;
}
</style>
</head>
<body>
<div id="flowform-full-page">
	<?php echo $this->container_html( $form_id, true ); ?>
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

		$decoded = wpff_decode( $post->post_content );
		if ( ! is_array( $decoded ) ) return $defaults;

		$design = $decoded['design'] ?? [];

		return array_merge( $defaults, array_filter( $design, fn( $v ) => $v !== '' && $v !== null ) );
	}

	/**
	 * Build a <style> block that pre-applies the form's key design tokens to
	 * a given CSS selector before the JS renderer runs.
	 *
	 * This eliminates the flash of unstyled background / spinner colours that
	 * occurs between page load and the JS injecting its own token <style>.
	 *
	 * @param  string $selector  CSS selector to scope the rules to.
	 * @param  array  $design    Design array from get_form_design().
	 * @since 1.0.0
	 * @return string
	 */
	private function design_vars_css( string $selector, array $design ): string {
		$bg    = esc_attr( $design['bg_color']     ?? '#ffffff' );
		$btn   = esc_attr( $design['button_color'] ?? '#111827' );
		$hint  = esc_attr( $design['hint_color']   ?? '#9ca3af' );

		return sprintf(
			'<style>%s{background-color:%s;--btn-color:%s;--hint-color:%s;}</style>',
			$selector,
			$bg,
			$btn,
			$hint
		);
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
		$design     = $this->get_form_design( $form_id );
		$selector   = sprintf( '[data-flowform-id="%d"]', $form_id );
		$style_tag  = $this->design_vars_css( $selector, $design );

		if ( $fullpage ) {
			return $style_tag . sprintf(
				'<div class="flowform-container" data-flowform-id="%d" data-ff-mode="fullpage"></div>',
				$form_id
			);
		}

		$inline_style = sprintf(
			'min-height:%s;border-radius:%s;',
			esc_attr( $height ),
			esc_attr( $border_radius )
		);

		return $style_tag . sprintf(
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
				[ 'page' => 'wpff_forms', 'action' => 'restore', 'form_id' => $form_id, 'status' => 'trash' ],
				admin_url( 'admin.php' )
			),
			'wpff_restore_form_nonce'
		);

		$post  = get_post( $form_id );
		$label = $post ? esc_html( $post->post_title ) : sprintf( __( 'Form #%d', 'wp-flowforms' ), $form_id );

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
				<strong><?php echo $label; ?></strong>
				<?php esc_html_e( 'is in the Trash and is not visible to visitors.', 'wp-flowforms' ); ?>
				&nbsp;<a href="<?php echo esc_url( $restore_url ); ?>"
					style="color:#92400e;text-decoration:underline;font-weight:600;white-space:nowrap;">
					<?php esc_html_e( 'Restore form', 'wp-flowforms' ); ?>
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
<title><?php esc_html_e( 'Form In Trash', 'wp-flowforms' ); ?></title>
<?php echo $this->standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--amber">🗑️</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form is in the trash.', 'wp-flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php
			printf(
				esc_html__( '"%s" has been moved to the trash and is not visible to visitors. Restore it to make it available again.', 'wp-flowforms' ),
				esc_html( $form_title )
			);
		?>
	</p>
	<a href="<?php echo esc_url( $restore_url ); ?>" class="wpff-standalone__btn">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
		</svg>
		<?php esc_html_e( 'Restore Form', 'wp-flowforms' ); ?>
	</a>
</div>
</body>
</html>
		<?php
	}

	/**
	 * Shared inline styles for the standalone unavailable/not-published pages.
	 *
	 * @since 1.0.0
	 */
	private function standalone_page_styles(): string {
		return '
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
	height: 100%; background: #fafafa;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	color: #1f2937;
}
.wpff-standalone {
	min-height: 100vh; display: flex; flex-direction: column;
	align-items: center; justify-content: center;
	padding: 40px 24px; text-align: center; gap: 16px;
}
.wpff-standalone__icon {
	width: 64px; height: 64px; border-radius: 50%;
	display: flex; align-items: center;
	justify-content: center; font-size: 28px; flex-shrink: 0;
}
.wpff-standalone__icon--grey { background: #f3f4f6; }
.wpff-standalone__icon--amber { background: #fef3c7; }
.wpff-standalone__title { font-size: 22px; font-weight: 600; color: #111827; }
.wpff-standalone__desc { font-size: 15px; color: #6b7280; max-width: 380px; line-height: 1.6; }
.wpff-standalone__btn {
	display: inline-flex; align-items: center; gap: 8px;
	padding: 10px 22px; border-radius: 8px; border: none;
	background: #111827; color: #fff; font-size: 15px;
	font-family: inherit; font-weight: 500; text-decoration: none;
	cursor: pointer; transition: background 0.15s;
}
.wpff-standalone__btn:hover { background: #374151; }
.wpff-standalone__btn svg { flex-shrink: 0; }
</style>';
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
<title><?php esc_html_e( 'Form Not Available', 'wp-flowforms' ); ?></title>
<?php echo $this->standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--grey">📋</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form is no longer available.', 'wp-flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php esc_html_e( 'The form you are looking for has been removed or is currently unavailable.', 'wp-flowforms' ); ?>
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
<title><?php esc_html_e( 'Form Not Published', 'wp-flowforms' ); ?></title>
<?php echo $this->standalone_page_styles(); ?>
</head>
<body>
<div class="wpff-standalone">
	<div class="wpff-standalone__icon wpff-standalone__icon--amber">🚧</div>
	<h1 class="wpff-standalone__title">
		<?php esc_html_e( 'This form hasn\'t been published yet.', 'wp-flowforms' ); ?>
	</h1>
	<p class="wpff-standalone__desc">
		<?php
			printf(
				esc_html__( '"%s" is not live yet. Publish it from the builder so visitors can fill it out.', 'wp-flowforms' ),
				esc_html( $form_title )
			);
		?>
	</p>
	<a href="<?php echo esc_url( $builder_url ); ?>" class="wpff-standalone__btn">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
		</svg>
		<?php esc_html_e( 'Open in Builder', 'wp-flowforms' ); ?>
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
