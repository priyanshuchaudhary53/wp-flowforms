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

$form_id       = absint( $attributes['formId']       ?? 0 );
$height        = sanitize_text_field( $attributes['height']        ?? '520px' );
$border_radius = sanitize_text_field( $attributes['borderRadius']  ?? '16px' );

if ( ! $form_id ) {
	echo '<!-- FlowForms block: no form selected -->';
	return;
}

$post = get_post( $form_id );

if ( ! $post || $post->post_type !== 'wpff_forms' ) {
	echo '<!-- FlowForms block: form not found -->';
	return;
}

if ( $post->post_status !== 'publish' ) {
	$frontend = wp_flowforms()->obj( 'frontend' );
	if ( $frontend ) {
		echo $frontend->trashed_form_notice( $form_id );
	}
	return;
}

$frontend = wp_flowforms()->obj( 'frontend' );

if ( ! $frontend ) {
	echo '<!-- FlowForms block: frontend not available -->';
	return;
}

// Flag so renderer assets are enqueued on this page.
$frontend->flag_form_id( $form_id );

// Delegate to container_html() so the design <style> tag is included,
// matching shortcode output exactly.
echo $frontend->container_html( $form_id, false, $height, $border_radius );
