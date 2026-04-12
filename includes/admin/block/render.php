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

$flowforms_form_id       = absint( $attributes['formId']       ?? 0 );
$flowforms_height        = sanitize_text_field( $attributes['height']        ?? '520px' );
$flowforms_border_radius = sanitize_text_field( $attributes['borderRadius']  ?? '16px' );

if ( ! $flowforms_form_id ) {
	echo '<!-- FlowForms block: no form selected -->';
	return;
}

$post = get_post( $flowforms_form_id );

if ( ! $post || $post->post_type !== 'flowforms_forms' ) {
	echo '<!-- FlowForms block: form not found -->';
	return;
}

if ( $post->post_status !== 'publish' ) {
	$flowforms_frontend = flowforms()->obj( 'frontend' );
	if ( $flowforms_frontend ) {
		echo wp_kses( $flowforms_frontend->trashed_form_notice( $flowforms_form_id ), flowforms_kses_form_container() );
	}
	return;
}

$flowforms_frontend = flowforms()->obj( 'frontend' );

if ( ! $flowforms_frontend ) {
	echo '<!-- FlowForms block: frontend not available -->';
	return;
}

// Flag so renderer assets are enqueued on this page.
$flowforms_frontend->flag_form_id( $flowforms_form_id );

// Delegate to container_html() — output matches shortcode exactly.
echo wp_kses( $flowforms_frontend->container_html( $flowforms_form_id, false, $flowforms_height, $flowforms_border_radius ), flowforms_kses_form_container() );
