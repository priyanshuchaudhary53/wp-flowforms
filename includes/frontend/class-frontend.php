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
 * @since 1.1.0
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

	public function __construct() {
		// Shortcode.
		add_shortcode( 'flowform', [ $this, 'render_shortcode' ] );

		// Enqueue assets after the shortcode / block has had a chance to flag
		// which form IDs are on the page.
		add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_assets' ], 20 );

		// Full-page embed + preview rewrite.
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

		if ( ! $post || $post->post_type !== 'wpff_forms' || $post->post_status !== 'publish' ) {
			return '<!-- FlowForms: form not found -->';
		}

		$this->flag_form_id( $form_id );

		return $this->container_html( $form_id, false, $height, $border_radius );
	}

	/**
	 * Flag a form ID as present on this page.
	 * Called by both the shortcode and the Gutenberg block render callback.
	 *
	 * @param int $form_id
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

		// Determine preview mode.
		$is_preview  = ! empty( $_GET['flowform_preview'] );
		$preview_ok  = $is_preview && $this->verify_preview_token( $_GET['token'] ?? '' );

		wp_localize_script( 'flowform-renderer', 'flowformPublicData', [
			'apiUrl'      => rest_url( 'formflow/v1' ),
			'nonce'       => wp_create_nonce( 'wp_rest' ),
			'previewMode' => $preview_ok,
			'formIds'     => $this->form_ids,
		] );

		$this->assets_enqueued = true;
	}

	/**
	 * Register the /flowform/{id} rewrite rule.
	 *
	 * Maps pretty URL to a query var the template_redirect hook picks up.
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
	 */
	public function handle_full_page_embed(): void {
		$form_id = absint( get_query_var( 'flowform_id', 0 ) );

		if ( ! $form_id ) {
			return;
		}

		$post = get_post( $form_id );

		if ( ! $post || $post->post_type !== 'wpff_forms' || $post->post_status !== 'publish' ) {
			wp_die(
				esc_html__( 'Form not found.', 'wp-flowforms' ),
				esc_html__( 'Form Not Found', 'wp-flowforms' ),
				[ 'response' => 404 ]
			);
		}

		// Enqueue assets manually for this bare page.
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
	 */
	public function handle_preview(): void {
		if ( empty( $_GET['flowform_preview'] ) ) {
			return;
		}

		$form_id = absint( $_GET['id'] ?? 0 );
		$token   = sanitize_text_field( $_GET['token'] ?? '' );

		if ( ! $form_id || ! $this->verify_preview_token( $token ) ) {
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
<?php
		// Output all enqueued styles and scripts via wp_head().
		wp_head();
?>
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
	 * @return string
	 */
	public static function generate_preview_token(): string {
		return wp_create_nonce( 'flowform_preview' );
	}

	/**
	 * Verify a preview token.
	 *
	 * @param string $token
	 * @return bool
	 */
	private function verify_preview_token( string $token ): bool {
		return (bool) wp_verify_nonce( $token, 'flowform_preview' );
	}

	/**
	 * Read the design object from a form's published slot, merged with defaults.
	 *
	 * @param  int   $form_id
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

		// Support both legacy (flat) and dual-slot formats.
		$content = isset( $decoded['published'] ) ? ( $decoded['published'] ?? [] ) : $decoded;
		$design  = is_array( $content['design'] ?? null ) ? $content['design'] : [];

		return array_merge( $defaults, array_filter( $design, fn( $v ) => ! empty( $v ) ) );
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
	 * Get the public shareable URL for a given form.
	 *
	 * Returns the pretty /flowform/{id} URL when pretty permalinks are enabled,
	 * otherwise falls back to a query-string URL.
	 *
	 * @param int $form_id
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
