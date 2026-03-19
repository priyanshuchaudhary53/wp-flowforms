/**
 * WP FlowForms — QuestionRenderer
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
export function renderQuestion( question, answer, error, design, onChange ) {
	const type      = question.type      ?? '';
	const content   = question.content   ?? {};
	const settings  = question.settings  ?? {};
	const alignment = design?.alignment  ?? 'center';

	const wrap = el( 'div', 'ff-question' );

	// ── Header ────────────────────────────────────────────────────────────────
	const header = el( 'div', 'ff-question-header' );

	const title = el( 'h2', 'ff-question-title' );
	title.textContent = content.title || 'Untitled question';
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
	} );

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

function buildInput( type, content, settings, answer, alignment, onChange ) {
	switch ( type ) {
		case 'short_text':      return buildShortText( settings, answer, onChange );
		case 'long_text':       return buildLongText( settings, answer, onChange );
		case 'email':           return buildEmail( settings, answer, onChange );
		case 'number':          return buildNumber( content, settings, answer, onChange );
		case 'multiple_choice': return buildChoice( content, settings, answer, alignment, onChange, false );
		case 'checkboxes':      return buildChoice( content, settings, answer, alignment, onChange, true );
		case 'rating':          return buildRating( settings, answer, onChange );
		case 'yes_no':          return buildYesNo( content, answer, onChange );
		default: {
			const fb = el( 'p', 'ff-unsupported' );
			fb.textContent = 'This question type is not supported.';
			return fb;
		}
	}
}

function buildShortText( settings, answer, onChange ) {
	const input = el( 'input' );
	input.type        = 'text';
	input.className   = 'ff-input ff-text-input';
	input.placeholder = settings.placeholder || 'Your answer here…';
	input.value       = answer ?? '';
	if ( settings.maxLength ) input.maxLength = settings.maxLength;
	input.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
	return input;
}

function buildLongText( settings, answer, onChange ) {
	const textarea   = el( 'textarea' );
	textarea.className   = 'ff-input ff-textarea-input';
	textarea.placeholder = settings.placeholder || 'Your answer here…';
	textarea.rows        = settings.rows ?? 4;
	textarea.value       = answer ?? '';
	textarea.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
	return textarea;
}

function buildEmail( settings, answer, onChange ) {
	const input = el( 'input' );
	input.type        = 'email';
	input.className   = 'ff-input ff-email-input';
	input.placeholder = settings.placeholder || 'name@example.com';
	input.value       = answer ?? '';
	input.addEventListener( 'input', ( e ) => onChange( e.target.value ) );
	return input;
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
	if ( settings.min !== undefined ) input.min = settings.min;
	if ( settings.max !== undefined ) input.max = settings.max;
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

function buildChoice( content, settings, answer, alignment, onChange, isMulti ) {
	const options = Array.isArray( content.options ) && content.options.length
		? content.options
		: [];

	const layout = settings.layout ?? 'vertical';
	const grid   = el( 'div', `ff-choices ff-choices--${ layout }` );
	if ( alignment !== 'center' ) grid.classList.add( 'ff-choices--left' );

	// Both multiple_choice and checkboxes store their answer as an array.
	// multiple_choice allows at most one item; checkboxes allows many.
	// Normalise whatever is stored into a clean array for local tracking.
	let selected = Array.isArray( answer ) ? [ ...answer ] : [];

	// Keep a map of value → label element for fast DOM updates
	const labelMap = new Map();

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
				// Toggle this value in the selection
				const idx = selected.indexOf( value );
				if ( idx === -1 ) {
					selected.push( value );
					label.classList.add( 'is-selected' );
				} else {
					selected.splice( idx, 1 );
					label.classList.remove( 'is-selected' );
				}
				onChange( [ ...selected ] );
			} else {
				// Single-select: always store as a one-item array so the
				// validator and server both receive a consistent array value.
				if ( selected[ 0 ] !== value ) {
					labelMap.forEach( ( lbl ) => lbl.classList.remove( 'is-selected' ) );
					selected = [ value ];
					label.classList.add( 'is-selected' );
				}
				onChange( [ ...selected ] );
			}
		} );

		grid.appendChild( label );
	} );

	return grid;
}

function buildRating( settings, answer, onChange ) {
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
		btn.setAttribute( 'aria-label', `Rate ${ i } out of ${ steps }` );

		const filled = i <= current;
		btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${ filled ? 'currentColor' : 'none' }" stroke="currentColor" stroke-width="1.5" width="36" height="36" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>`;

		if ( filled ) btn.classList.add( 'is-active' );
		stars.push( btn );

		btn.addEventListener( 'click', () => {
			current = i;
			applyRating( current );
			onChange( current );
		} );

		// Hover: preview the rating without committing
		btn.addEventListener( 'mouseenter', () => applyRating( i ) );

		wrap.appendChild( btn );
	}

	// On mouse-leave: restore the committed rating
	wrap.addEventListener( 'mouseleave', () => applyRating( current ) );

	return wrap;
}

function buildYesNo( content, answer, onChange ) {
	const wrap = el( 'div', 'ff-yes-no' );

	// Keep a reference to both buttons for instant DOM toggling
	const btns = {};

	[ { val: 'yes', label: content.yesLabel || 'Yes' },
	  { val: 'no',  label: content.noLabel  || 'No'  } ].forEach( ( { val, label } ) => {
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
