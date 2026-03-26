/**
 * WP FlowForms — Validator
 *
 * Pure validation function. Returns null when valid, or an error string.
 * All validation is skipped when previewMode is true so admins can
 * navigate freely through required questions during testing.
 */

import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * @param {Object}  question    The question object from form JSON.
 * @param {*}       answer      The current answer value.
 * @param {boolean} previewMode When true, all validation is skipped.
 * @returns {string|null}
 */
export function validate( question, answer, previewMode ) {
	// Skip everything in preview mode.
	if ( previewMode ) return null;

	const type     = question.type     ?? '';
	const settings = question.settings ?? {};

	// ── Required check ────────────────────────────────────────────────────────
	if ( settings.required && isEmpty( answer, type ) ) {
		return __( 'This field is required.', 'wp-flowforms' );
	}

	// If the field is empty and not required, nothing else to check.
	if ( isEmpty( answer, type ) ) return null;

	// ── Type-specific rules ───────────────────────────────────────────────────
	switch ( type ) {
		case 'email':
			if ( settings.confirmEmail ) {
				// answer is { email, confirm }
				const emailVal   = answer?.email   ?? '';
				const confirmVal = answer?.confirm ?? '';
				if ( ! isValidEmail( emailVal ) ) {
					return __( 'Please enter a valid email address.', 'wp-flowforms' );
				}
				if ( emailVal !== confirmVal ) {
					return __( 'Email addresses do not match.', 'wp-flowforms' );
				}
			} else {
				if ( ! isValidEmail( String( answer ) ) ) {
					return __( 'Please enter a valid email address.', 'wp-flowforms' );
				}
			}
			break;

		case 'number': {
			const num    = Number( answer );
			if ( isNaN( num ) ) return __( 'Please enter a valid number.', 'wp-flowforms' );
			const hasMin = settings.min !== undefined && settings.min !== '';
			const hasMax = settings.max !== undefined && settings.max !== '';
			if ( hasMin && num < Number( settings.min ) ) {
				return sprintf( __( 'Value must be at least %s.', 'wp-flowforms' ), settings.min );
			}
			if ( hasMax && num > Number( settings.max ) ) {
				return sprintf( __( 'Value must be at most %s.', 'wp-flowforms' ), settings.max );
			}
			break;
		}

		case 'rating': {
			const steps = Math.min( settings.steps ?? 5, 10 );
			const val   = Number( answer );
			if ( ! Number.isInteger( val ) || val < 1 || val > steps ) {
				return __( 'Please select a valid rating.', 'wp-flowforms' );
			}
			break;
		}

		case 'multiple_choice':
			if ( ! Array.isArray( answer ) || answer.length === 0 ) {
				return __( 'Please make a selection.', 'wp-flowforms' );
			}
			break;

		case 'checkboxes': {
			if ( ! Array.isArray( answer ) || answer.length === 0 ) {
				return __( 'Please make a selection.', 'wp-flowforms' );
			}
			const minSel = settings.minSelections ?? 0;
			const maxSel = settings.maxSelections ?? 0;
			if ( minSel > 0 && answer.length < minSel ) {
				return sprintf( /* translators: %s: minimum number of options */ _n( 'Please select at least %s option.', 'Please select at least %s options.', minSel, 'wp-flowforms' ), minSel );
			}
			if ( maxSel > 0 && answer.length > maxSel ) {
				return sprintf( /* translators: %s: maximum number of options */ _n( 'Please select at most %s option.', 'Please select at most %s options.', maxSel, 'wp-flowforms' ), maxSel );
			}
			break;
		}

		case 'yes_no':
			if ( answer !== 'yes' && answer !== 'no' ) {
				return __( 'Please select yes or no.', 'wp-flowforms' );
			}
			break;
	}

	return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true when an answer should be considered empty.
 *
 * @param {*}      value
 * @param {string} type
 * @returns {boolean}
 */
export function isEmpty( value, type = '' ) {
	if ( value === null || value === undefined ) return true;
	if ( Array.isArray( value ) )               return value.length === 0;
	// Email confirm mode stores { email, confirm }
	if ( type === 'email' && typeof value === 'object' ) {
		return ! value.email || value.email.trim() === '';
	}
	if ( typeof value === 'string' )            return value.trim() === '';
	return false;
}

/**
 * Basic email format check.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail( value ) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( value );
}
