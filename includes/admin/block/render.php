<?php
/**
 * Server-side render for the flowforms/form block.
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
	$wpff_frontend = flowforms()->obj( 'frontend' );
	if ( $wpff_frontend ) {
		echo wp_kses( $wpff_frontend->trashed_form_notice( $wpff_form_id ), wpff_kses_form_container() );
	}
	return;
}

$wpff_frontend = flowforms()->obj( 'frontend' );

if ( ! $wpff_frontend ) {
	echo '<!-- FlowForms block: frontend not available -->';
	return;
}

// Flag so renderer assets are enqueued on this page.
$wpff_frontend->flag_form_id( $wpff_form_id );

// Delegate to container_html() — output matches shortcode exactly.
echo wp_kses( $wpff_frontend->container_html( $wpff_form_id, false, $wpff_height, $wpff_border_radius ), wpff_kses_form_container() );
