<?php
/**
 * Server-side render for the wp-flowforms/form block.
 *
 * Available variables:
 *   $attributes  — block attributes array (formId, height, borderRadius)
 *   $content     — inner block content (unused — no inner blocks)
 *   $block       — WP_Block instance
 */

if ( ! defined( 'ABSPATH' ) ) exit;

$wpff_form_id       = absint( $attributes['formId']       ?? 0 );
$wpff_height        = sanitize_text_field( $attributes['height']        ?? '520px' );
$wpff_border_radius = sanitize_text_field( $attributes['borderRadius']  ?? '16px' );

if ( ! $wpff_form_id ) {
	echo '<!-- FlowForms block: no form selected -->';
	return;
}

$post = get_post( $wpff_form_id );

if ( ! $post || $post->post_type !== 'wpff_forms' ) {
	echo '<!-- FlowForms block: form not found -->';
	return;
}

if ( $post->post_status !== 'publish' ) {
	$wpff_frontend = wp_flowforms()->obj( 'frontend' );
	if ( $wpff_frontend ) {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML from internal method; all dynamic values are escaped within the method.
		echo $wpff_frontend->trashed_form_notice( $wpff_form_id );
	}
	return;
}

$wpff_frontend = wp_flowforms()->obj( 'frontend' );

if ( ! $wpff_frontend ) {
	echo '<!-- FlowForms block: frontend not available -->';
	return;
}

// Flag so renderer assets are enqueued on this page.
$wpff_frontend->flag_form_id( $wpff_form_id );

// Delegate to container_html() so the design <style> tag is included,
// matching shortcode output exactly.
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Trusted HTML from internal method; all dynamic values are escaped within the method.
echo $wpff_frontend->container_html( $wpff_form_id, false, $wpff_height, $wpff_border_radius );
