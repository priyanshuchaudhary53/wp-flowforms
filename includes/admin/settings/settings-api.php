<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * FlowForms Settings API
 *
 * Field rendering functions and sanitizer for the settings page.
 * Every public function is a standalone global named wpff_settings_{type}_field().
 *
 * @since 1.0.0
 */

/**
 * Render a single settings field as a <tr> for use inside a <table class="form-table">.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition array. Must include 'id' and 'type'.
 * @return string HTML output.
 */
function wpff_settings_render_field( array $args ): string {
	$type     = $args['type'] ?? 'text';
	$callback = "wpff_settings_{$type}_field";

	if ( ! function_exists( $callback ) ) {
		$callback = 'wpff_settings_text_field';
	}

	$content = $callback( $args );

	// Heading and content types render full-width with no label column.
	if ( in_array( $type, [ 'heading', 'content' ], true ) ) {
		return '<tr><td colspan="2">' . $content . '</td></tr>';
	}

	$label = esc_html( $args['label'] ?? '' );
	$desc  = ! empty( $args['desc'] )
		? '<p class="description">' . wp_kses_post( $args['desc'] ) . '</p>'
		: '';

	return sprintf(
		'<tr>
			<th scope="row"><label for="%1$s">%2$s</label></th>
			<td>%3$s%4$s</td>
		</tr>',
		esc_attr( $args['id'] ),
		$label,
		$content,
		$desc
	);
}

/**
 * Render a text input field.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition. Supports 'placeholder'.
 * @return string HTML output.
 */
function wpff_settings_text_field( array $args ): string {
	$value       = wpff_get_setting( $args['id'], $args['default'] ?? '' );
	$placeholder = $args['placeholder'] ?? '';

	return sprintf(
		'<input type="text" id="%1$s" name="%1$s" value="%2$s" placeholder="%3$s" class="regular-text">',
		esc_attr( $args['id'] ),
		esc_attr( $value ),
		esc_attr( $placeholder )
	);
}

/**
 * Render a textarea field.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition. Supports 'rows' (default 3).
 * @return string HTML output.
 */
function wpff_settings_textarea_field( array $args ): string {
	$value = wpff_get_setting( $args['id'], $args['default'] ?? '' );
	$rows  = absint( $args['rows'] ?? 3 );

	return sprintf(
		'<textarea id="%1$s" name="%1$s" rows="%2$d" class="large-text">%3$s</textarea>',
		esc_attr( $args['id'] ),
		$rows,
		esc_textarea( $value )
	);
}

/**
 * Render a toggle switch field.
 *
 * Uses the same toggle CSS class as the entries admin UI.
 * Value is 1 when on, 0 when off.
 * A hidden input with value 0 precedes the checkbox so unchecked state is posted.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition.
 * @return string HTML output.
 */
function wpff_settings_toggle_field( array $args ): string {
	$value   = wpff_get_setting( $args['id'], $args['default'] ?? false );
	$checked = $value ? ' checked' : '';
	$id      = esc_attr( $args['id'] );

	return sprintf(
		'<input type="hidden" name="%1$s" value="0">' .
		'<label class="wpff-toggle">' .
			'<input type="checkbox" id="%1$s" name="%1$s" value="1"%2$s>' .
			'<span class="wpff-toggle__track"></span>' .
		'</label>',
		$id,
		$checked
	);
}

/**
 * Render a select dropdown field.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition. Requires 'options' as ['value' => 'Label'].
 * @return string HTML output.
 */
function wpff_settings_select_field( array $args ): string {
	$value   = wpff_get_setting( $args['id'], $args['default'] ?? '' );
	$options = $args['options'] ?? [];
	$id      = esc_attr( $args['id'] );

	$html = sprintf( '<select id="%1$s" name="%1$s">', $id );

	foreach ( $options as $opt_value => $opt_label ) {
		$html .= sprintf(
			'<option value="%1$s"%2$s>%3$s</option>',
			esc_attr( $opt_value ),
			selected( $value, $opt_value, false ),
			esc_html( $opt_label )
		);
	}

	$html .= '</select>';

	return $html;
}

/**
 * Render a section heading (display only, not an input).
 *
 * Renders an <h2> with an optional <p> description.
 * Skipped on save.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition. Supports 'label' and 'desc'.
 * @return string HTML output.
 */
function wpff_settings_heading_field( array $args ): string {
	$html = '<h2 class="wpff-settings-heading">' . esc_html( $args['label'] ?? '' ) . '</h2>';

	if ( ! empty( $args['desc'] ) ) {
		$html .= '<p>' . wp_kses_post( $args['desc'] ) . '</p>';
	}

	return $html;
}

/**
 * Render raw HTML content (display only, not an input).
 *
 * Skipped on save.
 *
 * @since 1.0.0
 *
 * @param array $args Field definition. Requires 'content' with raw HTML.
 * @return string HTML output.
 */
function wpff_settings_content_field( array $args ): string {
	return wp_kses_post( $args['content'] ?? '' );
}

/**
 * Sanitize a settings field value based on its type.
 *
 * Supports a custom 'sanitize' callable in the field definition for advanced cases.
 *
 * @since 1.0.0
 *
 * @param array      $field    Field definition array.
 * @param mixed      $raw      Raw value from $_POST.
 * @param mixed      $previous Previous saved value (used as fallback for invalid selects).
 * @return mixed Sanitized value.
 */
function wpff_settings_sanitize_field( array $field, $raw, $previous ) {
	$type = $field['type'] ?? 'text';

	if ( ! empty( $field['sanitize'] ) && is_callable( $field['sanitize'] ) ) {
		return call_user_func( $field['sanitize'], $raw, $field, $previous );
	}

	switch ( $type ) {
		case 'toggle':
			return (bool) $raw;
		case 'number':
			return (float) $raw;
		case 'select':
			$raw = sanitize_text_field( $raw );
			return isset( $field['options'][ $raw ] ) ? $raw : ( $field['default'] ?? $previous );
		case 'textarea':
			return sanitize_textarea_field( wp_unslash( $raw ?? '' ) );
		case 'text':
		default:
			return sanitize_text_field( wp_unslash( $raw ?? '' ) );
	}
}
