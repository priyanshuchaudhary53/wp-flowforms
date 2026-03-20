<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * FlowForms_Block
 *
 * Registers the wp-flowforms/form Gutenberg block.
 * REST routes live in class-rest-api.php.
 */
class FlowForms_Block {

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

		register_block_type( WP_FLOWFORMS_PATH . 'build/block/block.json' );

		// Make admin URL available to the block editor JS.
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
			'window.wpff = ' . wp_json_encode( [ 'adminUrl' => admin_url() ] ) . ';',
			'before'
		);
	}
}

new FlowForms_Block();