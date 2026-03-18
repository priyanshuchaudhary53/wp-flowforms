/**
 * WP FlowForms — Validator
 *
 * Pure validation function. Returns null when valid, or an error string.
 * All validation is skipped when previewMode is true so admins can
 * navigate freely through required questions during testing.
 */

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
		return 'This field is required.';
	}

	// If the field is empty and not required, nothing else to check.
	if ( isEmpty( answer, type ) ) return null;

	// ── Type-specific rules ───────────────────────────────────────────────────
	switch ( type ) {
		case 'email':
			if ( ! isValidEmail( String( answer ) ) ) {
				return 'Please enter a valid email address.';
			}
			break;

		case 'number': {
			const num = Number( answer );
			if ( isNaN( num ) ) return 'Please enter a valid number.';
			if ( settings.min !== undefined && num < Number( settings.min ) ) {
				return `Value must be at least ${ settings.min }.`;
			}
			if ( settings.max !== undefined && num > Number( settings.max ) ) {
				return `Value must be at most ${ settings.max }.`;
			}
			break;
		}

		case 'rating': {
			const steps = Math.min( settings.steps ?? 5, 10 );
			const val   = Number( answer );
			if ( ! Number.isInteger( val ) || val < 1 || val > steps ) {
				return 'Please select a valid rating.';
			}
			break;
		}

		case 'multiple_choice':
		case 'checkboxes':
			if ( ! Array.isArray( answer ) || answer.length === 0 ) {
				return 'Please make a selection.';
			}
			break;

		case 'yes_no':
			if ( answer !== 'yes' && answer !== 'no' ) {
				return 'Please select yes or no.';
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
