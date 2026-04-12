<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * FlowForms_Settings
 *
 * Page controller for the FlowForms settings screen.
 * Handles tab routing, save, and HTML output.
 *
 * @since 1.0.0
 */
class FlowForms_Settings {

	/**
	 * Active tab slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public string $view = 'messages';

	/**
	 * Register admin_init hook.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_init', [ $this, 'init' ] );
	}

	/**
	 * Initialise the settings page: handle saves, resolve active tab, hook output.
	 * Bails immediately if not on the settings screen.
	 *
	 * @since 1.0.0
	 */
	public function init(): void {
		if ( ! wpff_is_admin_page( 'settings' ) ) {
			return;
		}

		$this->save();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only tab navigation param; sanitized via sanitize_key().
		$this->view = isset( $_GET['tab'] )
			? sanitize_key( $_GET['tab'] )
			: 'validation';

		// Fall back to the first registered tab if the slug is unknown.
		$tabs = $this->get_tabs();
		if ( ! array_key_exists( $this->view, $tabs ) ) {
			$this->view = array_key_first( $tabs );
		}

		add_action( 'wpff_admin_page', [ $this, 'output' ] );

		// Hook for add-ons.
		do_action( 'wpff_settings_init', $this );
	}

	/**
	 * Return all registered tab definitions.
	 *
	 * Each tab is an associative array with:
	 *   'label'  => string  — visible tab label
	 *   'form'   => bool    — whether the tab content is wrapped in a <form>
	 *   'submit' => string  — submit button label (only when 'form' is true)
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, array>
	 */
	public function get_tabs(): array {
		$tabs = [
			'messages' => [
				'label'  => __( 'Messages', 'flowforms' ),
				'form'   => true,
				'submit' => __( 'Save Settings', 'flowforms' ),
			],
			// Future tabs:
			// 'general'   => [ 'label' => __( 'General',   'flowforms' ), 'form' => true, 'submit' => __( 'Save Settings', 'flowforms' ) ],
		];

		/**
		 * Filters the registered settings tabs.
		 *
		 * @since 1.0.0
		 *
		 * @param array $tabs Tab definitions keyed by slug.
		 */
		return apply_filters( 'wpff_settings_tabs', $tabs );
	}

	/**
	 * Return registered field definitions, optionally filtered to a single tab.
	 *
	 * Core tab definitions are auto-loaded from
	 * includes/admin/settings/tabs/{slug}.php on demand.
	 * Each file must return an array of field definitions keyed by field ID.
	 *
	 * @since 1.0.0
	 *
	 * @param string $tab Tab slug. Empty string returns all tabs.
	 * @return array
	 */
	public function get_registered_fields( string $tab = '' ): array {
		$all = [];

		foreach ( array_keys( $this->get_tabs() ) as $slug ) {
			$file = WPFF_PATH . "includes/admin/settings/tabs/{$slug}.php";
			if ( file_exists( $file ) ) {
				$all[ $slug ] = require $file;
			}
		}

		/**
		 * Filters all settings field definitions.
		 *
		 * Array is keyed by tab slug, each value is an array of field definitions.
		 *
		 * @since 1.0.0
		 *
		 * @param array $all Field definitions grouped by tab slug.
		 */
		$all = apply_filters( 'wpff_settings_fields', $all );

		if ( empty( $tab ) ) {
			return $all;
		}

		return $all[ $tab ] ?? [];
	}

	/**
	 * Process a settings form submission.
	 *
	 * Verifies nonce, capability, and the active tab before sanitizing and
	 * persisting each field value to the wpff_settings option.
	 *
	 * @since 1.0.0
	 */
	public function save(): void {
		if (
			empty( $_POST['wpff_settings_submit'] ) ||
			empty( $_POST['_wpnonce'] ) ||
			! wp_verify_nonce( sanitize_key( $_POST['_wpnonce'] ), 'wpff_settings_save' ) ||
			! current_user_can( 'manage_options' )
		) {
			return;
		}

		$tab    = sanitize_key( $_POST['wpff_settings_tab'] ?? '' );
		$fields = $this->get_registered_fields( $tab );

		if ( empty( $fields ) ) {
			return;
		}

		$saved = get_option( 'wpff_settings', [] );

		/**
		 * Filters field types that should be skipped during save (display-only types).
		 *
		 * @since 1.0.0
		 *
		 * @param string[] $skip_types Array of type strings to skip.
		 */
		$skip_types = apply_filters( 'wpff_settings_skip_types', [ 'content', 'heading' ] );

		foreach ( $fields as $id => $field ) {
			if ( in_array( $field['type'] ?? '', $skip_types, true ) ) {
				continue;
			}

			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Unslash and sanitization are handled inside wpff_settings_sanitize_field() based on the field type.
			$raw         	= isset( $_POST[ $id ] ) ? wp_unslash( $_POST[ $id ] ) : null;
			$saved[ $id ] = wpff_settings_sanitize_field( $field, $raw, $saved[ $id ] ?? null );
		}

		update_option( 'wpff_settings', $saved );

		add_action( 'wpff_admin_page', function () {
			echo '<div class="notice notice-success is-dismissible"><p>'
				. esc_html__( 'Settings saved.', 'flowforms' )
				. '</p></div>';
		}, 1 );
	}

	/**
	 * Render the settings page HTML.
	 *
	 * @since 1.0.0
	 */
	public function output(): void {
		$tabs   = $this->get_tabs();
		$fields = $this->get_registered_fields( $this->view );
		$tab    = $tabs[ $this->view ] ?? [];
		?>
		<div class="wrap wpff-admin-wrap wpff-settings-wrap">

			<h1><?php esc_html_e( 'Settings', 'flowforms' ); ?></h1>

			<!-- Tab nav -->
			<nav class="nav-tab-wrapper wpff-settings-tabs">
				<?php foreach ( $tabs as $slug => $def ) :
					$url    = add_query_arg( [ 'page' => 'wpff_settings', 'tab' => $slug ], admin_url( 'admin.php' ) );
					$active = $slug === $this->view ? 'nav-tab-active' : '';
				?>
					<a href="<?php echo esc_url( $url ); ?>"
					   class="nav-tab <?php echo esc_attr( $active ); ?>">
						<?php echo esc_html( $def['label'] ); ?>
					</a>
				<?php endforeach; ?>
			</nav>

			<div class="wpff-settings-content">

				<?php if ( ! empty( $tab['form'] ) ) : ?>
				<form method="post" action="">
					<?php wp_nonce_field( 'wpff_settings_save' ); ?>
					<input type="hidden" name="wpff_settings_tab" value="<?php echo esc_attr( $this->view ); ?>">
				<?php endif; ?>

					<table class="form-table" role="presentation">
						<?php foreach ( $fields as $id => $args ) :
							$args['id'] = $id;
							echo wp_kses( wpff_settings_render_field( $args ), wpff_kses_settings_field() );
						endforeach; ?>
					</table>

					<?php if ( ! empty( $tab['submit'] ) ) : ?>
					<p class="submit">
						<button type="submit" name="wpff_settings_submit" value="1" class="button button-primary">
							<?php echo esc_html( $tab['submit'] ); ?>
						</button>
					</p>
					<?php endif; ?>

				<?php if ( ! empty( $tab['form'] ) ) : ?>
				</form>
				<?php endif; ?>

			</div>

		</div>
		<?php
	}
}

new FlowForms_Settings();
