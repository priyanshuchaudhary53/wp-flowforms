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

// Flag the form ID so the renderer assets get enqueued on this page.
$frontend = wp_flowforms()->obj( 'frontend' );
if ( $frontend ) {
  $frontend->flag_form_id( $form_id );
}

// Build inline style — width is always 100% via CSS; height and
// border-radius are controlled by the block attributes.
$style = sprintf(
  'min-height:%s;border-radius:%s;',
  esc_attr( $height ),
  esc_attr( $border_radius )
);

printf(
  '<div class="flowform-container" data-flowform-id="%d" style="%s"></div>',
  $form_id,
  $style
);
