<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * FlowForms_Block
 *
 * Registers the flowforms/form Gutenberg block.
 * REST routes live in class-rest-api.php.
 */
class FlowForms_Block {

	/**
	 * Registers the block type on the init hook.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', [ $this, 'register_block' ] );
	}

	/**
	 * Register the block type from block.json.
	 *
	 * The render callback is defined in render.php (the "render" key in
	 * block.json points to that file relative to block.json's location).
	 */
	public function register_block(): void {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		register_block_type( FLOWFORMS_PATH . 'build/block/block.json' );

		add_action( 'enqueue_block_editor_assets', [ $this, 'localize_block_data' ] );
	}

	/**
	 * Pass server-side data needed by the block editor.
	 *
	 * Uses wp_add_inline_script() on 'wp-blocks' (always enqueued in the
	 * editor) to avoid relying on a derived script handle that could change.
	 */
	public function localize_block_data(): void {
		wp_add_inline_script(
			'wp-blocks',
			'window.flowforms = ' . wp_json_encode( [
				'adminUrl' => admin_url(),
				'trashUrl' => add_query_arg(
					'_wpnonce',
					wp_create_nonce( 'flowforms_forms_nav' ),
					admin_url( 'admin.php?page=flowforms_forms&status=trash' )
				),
			] ) . ';',
			'before'
		);
	}
}

new FlowForms_Block();
