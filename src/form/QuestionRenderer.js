/**
 * FlowForms — QuestionRenderer
 *
 * Builds fully interactive DOM nodes for each question type.
 * Uses the same CSS custom properties (--btn-color, --title-color, etc.)
 * as the React canvas preview, so design tokens come for free.
 *
 * Selection state for choice-based questions (multiple_choice, checkboxes,
 * yes_no, rating) is managed entirely within the DOM — clicking an option
 * immediately updates the visual state without waiting for a re-render.
 * The onChange callback is still fired so FormApp can persist the answer.
 *
 * @param {Object}      question  Question object from form JSON.
 * @param {*}           answer    Current answer value (for controlled rendering).
 * @param {string|null} error     Validation error message, or null.
 * @param {Object}      design    Design object (for alignment + star color etc.)
 * @param {Function}    onChange  Callback: onChange(questionId, newValue)
 * @returns {HTMLElement}
 */

import { __ } from '@wordpress/i18n';

// ── Shuffle cache ─────────────────────────────────────────────────────────────
// Randomized option orders are computed once per question per page load and
// stored here, keyed by question ID. This prevents re-shuffling every time
// the user navigates back and forth between questions.
const _shuffleCache = new Map();
export function renderQuestion( question, answer, error, design, onChange, onAutoAdvance ) {
	const type      = question.type      ?? '';
	const content   = question.content   ?? {};
	const settings  = question.settings  ?? {};
	const alignment = design?.alignment  ?? 'center';

	const wrap = el( 'div', 'ff-question' );

	// ── Header ────────────────────────────────────────────────────────────────
	const header = el( 'div', 'ff-question-header' );

	const title = el( 'h2', 'ff-question-title' );
	title.textContent = content.title || __( 'Untitled question', 'flowforms' );
	header.appendChild( title );

	if ( content.description ) {
		const desc = el( 'p', 'ff-question-desc' );
		desc.textContent = content.description;
		header.appendChild( desc );
	}

	wrap.appendChild( header );

	// ── Input area ────────────────────────────────────────────────────────────
	const inputWrap = el( 'div', 'ff-question-input' );
	const input     = buildInput( type, content, settings, answer, alignment, ( val ) => {
		onChange( question.id, val );
	}, question.id, onAutoAdvance );

	inputWrap.appendChild( input );
	wrap.appendChild( inputWrap );

	// ── Error message ─────────────────────────────────────────────────────────
	if ( error ) {
		const errEl = el( 'p', 'ff-question-error' );
		errEl.textContent = error;
		wrap.appendChild( errEl );
	}

	return wrap;
}

// ── Input builders ────────────────────────────────────────────────────────────

function buildInput( type, content, settings, answer, alignment, onChange, questionId, onAutoAdvance ) {
	switch ( type ) {
		case 'short_text':      return buildShortText( settings, answer, onChange );
		case 'long_text':       return buildLongText( settings, answer, onChange );
		case 'email':           return buildEmail( settings, answer, onChange );
		case 'number':          return buildNumber( content, settings, answer, onChange );
		case 'multiple_choice': return buildChoice( content, settings, answer, alignment, onChange, false, questionId, onAutoAdvance );
		case 'checkboxes':      return buildChoice( content, settings, answer, alignment, onChange, true, questionId );
		case 'rating':          return buildRating( settings, answer, onChange, onAutoAdvance );
		case 'yes_no':          return buildYesNo( content, answer, onChange, onAutoAdvance );
		default: {
			const fb = el( 'p', 'ff-unsupported' );
			fb.textContent = __( 'This question type is not supported.', 'flowforms' );
			return fb;
		}
	}
}

function buildShortText( settings, answer, onChange ) {
	const input = el( 'input' );
	input.type        = 'text';
	input.className   = 'ff-input ff-text-input';
	input.placeholder = settings.placeholder || window.flowformPublicData?.i18n?.textPlaceholder || __( 'Your answer here…', 'flowforms' );
	input.value       = answer ?? '';
	if ( settings.maxLength ) input.maxLength = settings.maxLength;
	input.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
	return input;
}

function buildLongText( settings, answer, onChange ) {
	const textarea   = el( 'textarea' );
	textarea.className   = 'ff-input ff-textarea-input';
	textarea.placeholder = settings.placeholder || window.flowformPublicData?.i18n?.textPlaceholder || __( 'Your answer here…', 'flowforms' );
	textarea.rows        = settings.rows ?? 4;
	textarea.value       = answer ?? '';
	if ( settings.maxLength ) textarea.maxLength = settings.maxLength;
	textarea.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
	return textarea;
}

function buildEmail( settings, answer, onChange ) {
	// answer is a string when no confirm, or { email, confirm } when confirm is on
	const isConfirm = !! settings.confirmEmail;
	const emailVal  = isConfirm ? ( answer?.email  ?? '' ) : ( answer ?? '' );
	const confirmVal = isConfirm ? ( answer?.confirm ?? '' ) : '';

	if ( ! isConfirm ) {
		const input = el( 'input' );
		input.type        = 'email';
		input.className   = 'ff-input ff-email-input';
		input.placeholder = settings.placeholder || window.flowformPublicData?.i18n?.emailPlaceholder || __( 'name@example.com', 'flowforms' );
		input.value       = emailVal;
		input.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
		return input;
	}

	// Confirm email mode — two inputs in a wrapper
	const wrap = el( 'div', 'ff-email-confirm-wrap' );

	const input1 = el( 'input' );
	input1.type        = 'email';
	input1.className   = 'ff-input ff-email-input';
	input1.placeholder = settings.placeholder || window.flowformPublicData?.i18n?.emailPlaceholder || __( 'name@example.com', 'flowforms' );
	input1.value       = emailVal;

	const label2 = el( 'label', 'ff-confirm-label' );
	label2.textContent = window.flowformPublicData?.i18n?.confirmEmailLabel ?? __( 'Confirm email', 'flowforms' );

	const input2 = el( 'input' );
	input2.type        = 'email';
	input2.className   = 'ff-input ff-email-input';
	input2.placeholder = window.flowformPublicData?.i18n?.confirmEmailPlaceholder ?? __( 'Confirm your email', 'flowforms' );
	input2.value       = confirmVal;

	const emit = () => onChange( { email: input1.value, confirm: input2.value } );
	input1.addEventListener( 'input', emit );
	input2.addEventListener( 'input', emit );

	wrap.appendChild( input1 );
	wrap.appendChild( label2 );
	wrap.appendChild( input2 );

	return wrap;
}

function buildNumber( content, settings, answer, onChange ) {
	const wrap  = el( 'div', 'ff-number-wrap' );

	if ( content.prefix ) {
		const prefix = el( 'span', 'ff-number-prefix' );
		prefix.textContent = content.prefix;
		wrap.appendChild( prefix );
	}

	const input = el( 'input' );
	input.type        = 'number';
	input.className   = 'ff-input ff-number-input';
	input.placeholder = settings.placeholder || '0';
	input.value       = answer ?? '';
	if ( settings.min  !== undefined && settings.min  !== '' ) input.min  = settings.min;
	if ( settings.max  !== undefined && settings.max  !== '' ) input.max  = settings.max;
	if ( settings.step !== undefined && settings.step !== '' ) input.step = settings.step;
	input.addEventListener( 'input', ( e ) => {
		onChange( e.target.value === '' ? '' : Number( e.target.value ) );
	} );
	wrap.appendChild( input );

	if ( content.suffix ) {
		const suffix = el( 'span', 'ff-number-suffix' );
		suffix.textContent = content.suffix;
		wrap.appendChild( suffix );
	}

	return wrap;
}

function buildChoice( content, settings, answer, alignment, onChange, isMulti, questionId, onAutoAdvance ) {
	let options = Array.isArray( content.options ) && content.options.length
		? [ ...content.options ]
		: [];

	// Randomize order if enabled — use cache so order stays stable per session
	if ( settings.randomize ) {
		if ( ! _shuffleCache.has( questionId ) ) {
			for ( let i = options.length - 1; i > 0; i-- ) {
				const j = Math.floor( Math.random() * ( i + 1 ) );
				[ options[ i ], options[ j ] ] = [ options[ j ], options[ i ] ];
			}
			_shuffleCache.set( questionId, options.map( ( o ) => o.value ?? o.label ) );
		} else {
			// Restore cached order
			const order = _shuffleCache.get( questionId );
			options.sort( ( a, b ) => {
				const ai = order.indexOf( a.value ?? a.label );
				const bi = order.indexOf( b.value ?? b.label );
				return ( ai === -1 ? 999 : ai ) - ( bi === -1 ? 999 : bi );
			} );
		}
	}

	const layout = settings.layout ?? 'vertical';
	const grid   = el( 'div', `ff-choices ff-choices--${ layout }` );
	if ( alignment !== 'center' ) grid.classList.add( 'ff-choices--left' );

	// Both multiple_choice and checkboxes store answer as an array.
	let selected = Array.isArray( answer ) ? [ ...answer ] : [];

	const maxSel = isMulti && settings.maxSelections > 0 ? settings.maxSelections : Infinity;

	const labelMap = new Map();

	// Callback set by the "Other" block so regular option clicks can reset it
	let resetOtherPill = null;

	options.forEach( ( opt ) => {
		const value    = opt.value ?? opt.label;
		const label    = el( 'label', 'ff-choice-item' );
		const isActive = selected.includes( value );
		if ( isActive ) label.classList.add( 'is-selected' );

		const indicator = el( 'span', isMulti ? 'ff-choice-checkbox' : 'ff-choice-radio' );
		label.appendChild( indicator );

		const text = el( 'span', 'ff-choice-label' );
		text.textContent = opt.label || '';
		label.appendChild( text );

		labelMap.set( value, label );

		label.addEventListener( 'click', () => {
			if ( isMulti ) {
				const idx = selected.indexOf( value );
				if ( idx === -1 ) {
					if ( selected.length >= maxSel ) return;
					selected.push( value );
					label.classList.add( 'is-selected' );
				} else {
					selected.splice( idx, 1 );
					label.classList.remove( 'is-selected' );
				}
				onChange( [ ...selected ] );
			} else {
				if ( selected[ 0 ] !== value ) {
					labelMap.forEach( ( lbl ) => lbl.classList.remove( 'is-selected' ) );
					// Reset "Other" pill to idle so it doesn't stay visually selected
					if ( resetOtherPill ) resetOtherPill();
					selected = [ value ];
					label.classList.add( 'is-selected' );
				}
				onChange( [ ...selected ] );
				if ( typeof onAutoAdvance === 'function' ) onAutoAdvance();
			}
		} );

		grid.appendChild( label );
	} );

	// "Other" option — inline-edit pattern
	if ( settings.allowOther ) {
		// The stored value for a confirmed "other" answer is '__other__:<text>'.
		// Find it in the current selection to restore state on re-render.
		const otherStored = selected.find( ( v ) => typeof v === 'string' && v.startsWith( '__other__:' ) );
		const otherText   = otherStored ? otherStored.slice( 10 ) : '';

		// Three possible states for this slot:
		//   'idle'     — shows the "Other" pill (not selected, not editing)
		//   'editing'  — pill replaced by inline input + tick button
		//   'confirmed'— shows a regular-looking option pill with the typed text
		//
		// On re-render we restore directly to the correct state.
		let otherState = otherStored ? 'confirmed' : 'idle';

		// Container that holds whichever DOM state is active
		const otherWrap = el( 'div', 'ff-other-wrap' );

		// ── Helper: remove other from selection ───────────────────────────
		const clearOtherFromSelected = () => {
			const idx = selected.findIndex( ( v ) => typeof v === 'string' && v.startsWith( '__other__:' ) );
			if ( idx !== -1 ) selected.splice( idx, 1 );
		};

		// ── Helper: deselect all regular options (single-select only) ─────
		const clearRegularSelection = () => {
			if ( ! isMulti ) {
				labelMap.forEach( ( lbl ) => lbl.classList.remove( 'is-selected' ) );
				// Remove any regular option from selected (keep __other__ handling separate)
				selected = selected.filter( ( v ) => typeof v === 'string' && v.startsWith( '__other__:' ) );
			}
		};

		// ── Render: idle pill ─────────────────────────────────────────────
		const renderIdle = () => {
			otherWrap.innerHTML = '';
			otherState = 'idle';
			// Expose reset so regular option clicks can call it
			resetOtherPill = () => {
				clearOtherFromSelected();
				renderIdle();
			};

			const pill = el( 'div', 'ff-choice-item ff-other-idle' );

			const indicator = el( 'span', isMulti ? 'ff-choice-checkbox' : 'ff-choice-radio' );
			pill.appendChild( indicator );

			const label = el( 'span', 'ff-choice-label' );
			label.textContent = window.flowformPublicData?.i18n?.otherLabel ?? __( 'Other', 'flowforms' );
			pill.appendChild( label );

			pill.addEventListener( 'click', () => {
				if ( ! isMulti ) clearRegularSelection();
				renderEditing( '' );
			} );

			otherWrap.appendChild( pill );
		};

		// ── Render: editing (inline input + tick) ─────────────────────────
		const renderEditing = ( prefill ) => {
			otherWrap.innerHTML = '';
			otherState = 'editing';
			resetOtherPill = () => {
				clearOtherFromSelected();
				renderIdle();
			};

			const pill = el( 'div', 'ff-choice-item ff-other-editing is-selected' );

			const input = el( 'input' );
			input.type        = 'text';
			input.className   = 'ff-other-inline-input';
			input.placeholder = window.flowformPublicData?.i18n?.otherPlaceholder ?? __( 'Type your answer…', 'flowforms' );
			input.value       = prefill;
			pill.appendChild( input );

			const tick = el( 'button', 'ff-other-tick' );
			tick.type      = 'button';
			tick.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
			tick.setAttribute( 'aria-label', window.flowformPublicData?.i18n?.otherConfirm ?? __( 'Confirm', 'flowforms' ) );
			pill.appendChild( tick );

			// Stop label-click bubbling from the input or tick
			input.addEventListener( 'click', ( e ) => e.stopPropagation() );
			tick.addEventListener( 'click',  ( e ) => {
				e.stopPropagation();
				const text = input.value.trim();
				if ( ! text ) {
					// Empty — revert to idle, deselect
					clearOtherFromSelected();
					onChange( [ ...selected ] );
					renderIdle();
					return;
				}
				// Confirm with text
				const encoded = `__other__:${ text }`;
				clearOtherFromSelected();
				if ( isMulti ) {
					selected.push( encoded );
				} else {
					selected = [ encoded ];
				}
				onChange( [ ...selected ] );
				renderConfirmed( text );
				if ( ! isMulti && typeof onAutoAdvance === 'function' ) onAutoAdvance();
			} );

			// Allow Enter key to confirm
			input.addEventListener( 'keydown', ( e ) => {
				if ( e.key === 'Enter' ) {
					e.preventDefault();
					tick.click();
				}
			} );

			otherWrap.appendChild( pill );
			// Focus after paint so the pill animation doesn't fight it
			requestAnimationFrame( () => input.focus() );
		};

		// ── Render: confirmed (looks like a regular selected option) ──────
		const renderConfirmed = ( text ) => {
			otherWrap.innerHTML = '';
			otherState = 'confirmed';
			resetOtherPill = () => {
				clearOtherFromSelected();
				renderIdle();
			};

			const pill = el( 'div', 'ff-choice-item ff-other-confirmed is-selected' );

			const indicator = el( 'span', isMulti ? 'ff-choice-checkbox' : 'ff-choice-radio' );
			pill.appendChild( indicator );

			const labelEl = el( 'span', 'ff-choice-label' );
			labelEl.textContent = text;
			pill.appendChild( labelEl );

			pill.addEventListener( 'click', () => {
				// Click on confirmed pill → go back to editing with pre-filled text
				if ( ! isMulti ) clearRegularSelection();
				renderEditing( text );
			} );

			otherWrap.appendChild( pill );
		};

		// Restore the correct state from stored answer
		if ( otherState === 'confirmed' ) {
			renderConfirmed( otherText );
		} else {
			renderIdle();
		}

		grid.appendChild( otherWrap );
	}

	return grid;
}

function buildRating( settings, answer, onChange, onAutoAdvance ) {
	const steps   = Math.min( settings.steps ?? 5, 10 );
	const wrap    = el( 'div', 'ff-rating' );
	let   current = Number( answer ) || 0;

	const stars = [];

	const applyRating = ( n ) => {
		stars.forEach( ( btn, idx ) => {
			const filled = idx < n;
			btn.classList.toggle( 'is-active', filled );
			btn.querySelector( 'svg' ).setAttribute( 'fill', filled ? 'currentColor' : 'none' );
		} );
	};

	for ( let i = 1; i <= steps; i++ ) {
		const btn = el( 'button', 'ff-rating-star' );
		btn.type = 'button';
		btn.setAttribute( 'aria-label', ( window.flowformPublicData?.i18n?.ratingLabel ?? __( 'Rate {value} out of {max}', 'flowforms' ) ).replace( '{value}', i ).replace( '{max}', steps ) );

		const filled = i <= current;
		btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${ filled ? 'currentColor' : 'none' }" stroke="currentColor" stroke-width="1.5" width="36" height="36" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>`;

		if ( filled ) btn.classList.add( 'is-active' );
		stars.push( btn );

		btn.addEventListener( 'click', () => {
			current = i;
			applyRating( current );
			onChange( current );
			if ( typeof onAutoAdvance === 'function' ) onAutoAdvance();
		} );

		// Hover: preview the rating without committing
		btn.addEventListener( 'mouseenter', () => applyRating( i ) );

		wrap.appendChild( btn );
	}

	// On mouse-leave: restore the committed rating
	wrap.addEventListener( 'mouseleave', () => applyRating( current ) );

	return wrap;
}

function buildYesNo( content, answer, onChange, onAutoAdvance ) {
	const wrap = el( 'div', 'ff-yes-no' );

	// Keep a reference to both buttons for instant DOM toggling
	const btns = {};

	[ { val: 'yes', label: content.yesLabel || window.flowformPublicData?.i18n?.yes || __( 'Yes', 'flowforms' ) },
	  { val: 'no',  label: content.noLabel  || window.flowformPublicData?.i18n?.no  || __( 'No', 'flowforms' ) } ].forEach( ( { val, label } ) => {
		const btn = el( 'button', 'ff-choice-item ff-yes-no-btn' );
		btn.type = 'button';
		btn.textContent = label;
		if ( answer === val ) btn.classList.add( 'is-selected' );

		btns[ val ] = btn;

		btn.addEventListener( 'click', () => {
			// Deselect both, select clicked
			Object.values( btns ).forEach( ( b ) => b.classList.remove( 'is-selected' ) );
			btn.classList.add( 'is-selected' );
			onChange( val );
			if ( typeof onAutoAdvance === 'function' ) onAutoAdvance();
		} );

		wrap.appendChild( btn );
	} );

	return wrap;
}

// ── DOM helper ────────────────────────────────────────────────────────────────

function el( tag, className ) {
	const node = document.createElement( tag );
	if ( className ) node.className = className;
	return node;
}
