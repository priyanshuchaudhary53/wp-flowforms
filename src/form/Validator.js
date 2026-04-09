/**
 * FlowForms — Validator
 *
 * Pure validation function. Returns null when valid, or an error string.
 * All validation is skipped when previewMode is true so admins can
 * navigate freely through required questions during testing.
 */


import { __ } from '@wordpress/i18n';

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
		return window.flowformPublicData?.i18n?.required ?? __( 'This field is required.', 'flowforms' );
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
					return window.flowformPublicData?.i18n?.email ?? __( 'Please enter a valid email address.', 'flowforms' );
				}
				if ( emailVal !== confirmVal ) {
					return window.flowformPublicData?.i18n?.emailMismatch ?? __( 'Email addresses do not match.', 'flowforms' );
				}
			} else {
				if ( ! isValidEmail( String( answer ) ) ) {
					return window.flowformPublicData?.i18n?.email ?? __( 'Please enter a valid email address.', 'flowforms' );
				}
			}
			break;

		case 'number': {
			const num    = Number( answer );
			if ( isNaN( num ) ) return window.flowformPublicData?.i18n?.number ?? __( 'Please enter a valid number.', 'flowforms' );
			const hasMin = settings.min !== undefined && settings.min !== '';
			const hasMax = settings.max !== undefined && settings.max !== '';
			if ( hasMin && num < Number( settings.min ) ) {
				return ( window.flowformPublicData?.i18n?.numberMin ?? __( 'Value must be at least {min}.', 'flowforms' ) ).replace( '{min}', settings.min );
			}
			if ( hasMax && num > Number( settings.max ) ) {
				return ( window.flowformPublicData?.i18n?.numberMax ?? __( 'Value must be at most {max}.', 'flowforms' ) ).replace( '{max}', settings.max );
			}
			break;
		}

		case 'rating': {
			const steps = Math.min( settings.steps ?? 5, 10 );
			const val   = Number( answer );
			if ( ! Number.isInteger( val ) || val < 1 || val > steps ) {
				return window.flowformPublicData?.i18n?.rating ?? __( 'Please select a valid rating.', 'flowforms' );
			}
			break;
		}

		case 'multiple_choice':
			if ( ! Array.isArray( answer ) || answer.length === 0 ) {
				return window.flowformPublicData?.i18n?.selection ?? __( 'Please make a selection.', 'flowforms' );
			}
			break;

		case 'checkboxes': {
			if ( ! Array.isArray( answer ) || answer.length === 0 ) {
				return window.flowformPublicData?.i18n?.selection ?? __( 'Please make a selection.', 'flowforms' );
			}
			const minSel = settings.minSelections ?? 0;
			const maxSel = settings.maxSelections ?? 0;
			if ( minSel > 0 && answer.length < minSel ) {
				return ( window.flowformPublicData?.i18n?.checkboxesMin ?? __( 'Please select at least {count} options.', 'flowforms' ) ).replace( '{count}', minSel );
			}
			if ( maxSel > 0 && answer.length > maxSel ) {
				return ( window.flowformPublicData?.i18n?.checkboxesMax ?? __( 'Please select at most {count} options.', 'flowforms' ) ).replace( '{count}', maxSel );
			}
			break;
		}

		case 'yes_no':
			if ( answer !== 'yes' && answer !== 'no' ) {
				return window.flowformPublicData?.i18n?.yesNo ?? __( 'Please select yes or no.', 'flowforms' );
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
