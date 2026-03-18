/**
 * Webpack config for WP FlowForms.
 *
 * Extends the default @wordpress/scripts config to build two separate bundles:
 *
 *   build/builder/index.js   ← React admin form builder  (existing)
 *   build/form/index.js      ← Vanilla JS public renderer (new, Phase 1)
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#provide-your-own-webpack-config
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path          = require( 'path' );

module.exports = {
	...defaultConfig,

	entry: {
		// ── Admin form builder ─────────────────────────────────────────────
		// Keeps the existing builder bundle at build/builder/index.js.
		// The PHP builder class (class-builder.php) enqueues this file.
		'builder/index': path.resolve( __dirname, 'src/builder/index.js' ),

		// ── Public form renderer ───────────────────────────────────────────
		// Compiled to build/form/index.js and build/form/style-index.css.
		// The PHP frontend class (class-frontend.php) enqueues this only on
		// pages that contain a [flowform] shortcode or block.
		'form/index': path.resolve( __dirname, 'src/form/index.js' ),
	},

	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
		// Each entry gets its own sub-folder so asset manifests don't clash.
		filename: '[name].js',
	},
};