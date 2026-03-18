/**
 * WP FlowForms — FormApp
 *
 * Rendering modes
 * ───────────────
 *  full-page  data-ff-mode="fullpage" → position:fixed; inset:0
 *  shortcode  (default) → inline, sized by parent theme
 *
 * Architecture
 * ────────────
 *  • Permanent skeleton built once in boot():
 *      [progress bar]  [bg layer]  [content wrapper]  [nav bar]
 *
 *  • Nav bar (prev/next) is FIXED at the bottom — never re-rendered.
 *    Prev is disabled on first question, next is disabled on last question.
 *    Both buttons are always visible on question screens; nav is hidden on
 *    welcome and thank-you screens.
 *
 *  • Background layer is repainted with a cross-fade on every screen change.
 *
 *  • Screen transitions:
 *      1. Exit animation plays on current screen (slide-down + fade-out, all at once)
 *      2. Short gap (EXIT_GAP ms) before new screen is rendered
 *      3. New screen renders immediately (no container-level slide)
 *      4. Content elements animate in with staggered fade-up:
 *         title → description → field → actions (OK btn + hint)
 *
 *  • Required-field error is injected in-place — no re-render, no transition.
 */

import { renderQuestion }                       from './QuestionRenderer.js';
import { validate }                             from './Validator.js';
import { applyDesignTokens, resolveBackground } from './designTokens.js';

// ── Timing constants (keep in sync with CSS) ──────────────────────────────────
const EXIT_DURATION = 260;   // ms — exit animation duration
const EXIT_GAP      = 60;    // ms — pause between exit end and entry start
const BG_FADE       = 400;   // ms — background cross-fade duration
const ENTRY_STAGGER = 80;    // ms — delay increment between staggered entry elements

export class FormApp {

	constructor( container, formData, opts = {} ) {
		this.container   = container;
		this.formData    = formData;
		this.previewMode = opts.previewMode ?? false;

		this.state = {
			currentScreen: 'welcome',
			currentIndex:  0,
			answers:       {},
			errors:        {},
			previewMode:   this.previewMode,
			submitted:     false,
		};

		this._questions = formData.content?.questions    ?? [];
		this._welcome   = formData.content?.welcomeScreen;
		this._thankYou  = formData.content?.thankYouScreen;
		this._design    = formData.content?.design       ?? {};

		// Permanent structural elements (built once in boot)
		this._progressEl     = null;
		this._bgEl           = null;
		this._contentWrapper = null;
		this._navEl          = null;
		this._prevBtn        = null;
		this._nextBtn        = null;

		// Guard against overlapping transitions
		this._transitioning = false;
	}

	// ── Boot ──────────────────────────────────────────────────────────────────

	boot() {
		applyDesignTokens( this.container, this._design );

		const isFullPage = this.container.dataset.ffMode === 'fullpage';
		if ( isFullPage ) this.container.classList.add( 'ff-fullpage' );

		this.container.innerHTML = '';

		// 1. Progress bar — pinned to top, never transitions
		this._progressEl = document.createElement( 'div' );
		this._progressEl.className = 'ff-progress-fixed';
		this._progressEl.innerHTML =
			'<div class="ff-progress-track"><div class="ff-progress-bar"></div></div>' +
			'<span class="ff-progress-label"></span>';
		this.container.appendChild( this._progressEl );

		// 2. Background layer — cross-fades on screen change, never animates position
		this._bgEl = document.createElement( 'div' );
		this._bgEl.className = 'ff-bg-layer';
		this.container.appendChild( this._bgEl );

		// 3. Content wrapper — new .ff-screen slots are rendered here
		this._contentWrapper = document.createElement( 'div' );
		this._contentWrapper.className = 'ff-content-wrapper';
		this.container.appendChild( this._contentWrapper );

		// 4. Nav bar — permanent, fixed at bottom, updated via _updateNav()
		this._navEl = document.createElement( 'div' );
		this._navEl.className = 'ff-nav-bar';
		this._navEl.innerHTML =
			'<button type="button" class="ff-btn-nav ff-btn-prev" aria-label="Previous">' +
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">' +
					'<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>' +
				'</svg>' +
				'<span>Previous</span>' +
			'</button>' +
			'<button type="button" class="ff-btn-nav ff-btn-next" aria-label="Next">' +
				'<span class="ff-nav-next-label">Next</span>' +
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">' +
					'<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>' +
				'</svg>' +
			'</button>';
		this.container.appendChild( this._navEl );

		this._prevBtn = this._navEl.querySelector( '.ff-btn-prev' );
		this._nextBtn = this._navEl.querySelector( '.ff-btn-next' );

		this._prevBtn.addEventListener( 'click', () => {
			if ( this._prevBtn.disabled || this._transitioning ) return;
			this._lastDir = 'back';
			this._back();
		} );
		this._nextBtn.addEventListener( 'click', () => {
			if ( this._nextBtn.disabled || this._transitioning ) return;
			this._lastDir = 'forward';
			this._advance();
		} );

		// Initial render — no exit animation, just staggered entry
		this._updateProgress();
		this._paintBackground( false );
		this._renderScreenImmediate();
		this._updateNav();

		document.addEventListener( 'flowform:previewToggle', ( e ) => {
			this.state.previewMode = e.detail.skipRequired;
		} );

		window.addEventListener( 'message', ( e ) => {
			if ( e.data?.type === 'DESIGN_UPDATE' ) {
				this._design = e.data.design;
				applyDesignTokens( this.container, this._design );
				this._paintBackground( true );
			}
		} );
	}

	// ── Background cross-fade ─────────────────────────────────────────────────

	/**
	 * Repaint the background for the current screen.
	 * @param {boolean} animate  When true, cross-fade old → new.
	 */
	_paintBackground( animate ) {
		const container = this._bgEl;
		if ( ! container ) return;

		const screen = this.state.currentScreen === 'welcome'  ? this._welcome
		             : this.state.currentScreen === 'thankYou' ? this._thankYou
		             : this._currentQuestion();

		const settings = screen?.settings ?? {};
		const { bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness }
			= resolveBackground( settings, this._design );

		// Build the new background element
		const newBg = document.createElement( 'div' );
		newBg.className = 'ff-bg-layer-inner';

		const isSplit = bgLayout === 'split';

		if ( isSplit ) {
			newBg.classList.add( 'ff-bg-layer--split' );
			const imageLeft = bgPosition !== 'right';

			if ( globalBg ) {
				const globalDiv = document.createElement( 'div' );
				globalDiv.className = 'ff-bg-global-wallpaper';
				globalDiv.style.backgroundImage = `url(${ globalBg })`;
				applyBrightnessOverlay( globalDiv, globalBrightness );
				newBg.appendChild( globalDiv );
			}

			if ( bgImage ) {
				const panel = document.createElement( 'div' );
				panel.className = imageLeft
					? 'ff-bg-split-panel ff-bg-split-panel--left'
					: 'ff-bg-split-panel ff-bg-split-panel--right';
				panel.style.backgroundImage = `url(${ bgImage })`;
				newBg.appendChild( panel );
			}

			this._contentWrapper.classList.toggle( 'ff-content-wrapper--split-left',  !! bgImage && imageLeft );
			this._contentWrapper.classList.toggle( 'ff-content-wrapper--split-right', !! bgImage && ! imageLeft );

		} else {
			newBg.classList.add( 'ff-bg-layer--wallpaper' );
			this._contentWrapper.classList.remove(
				'ff-content-wrapper--split-left',
				'ff-content-wrapper--split-right'
			);
			if ( bgImage ) {
				newBg.style.backgroundImage    = `url(${ bgImage })`;
				newBg.style.backgroundSize     = 'cover';
				newBg.style.backgroundPosition = 'center';
				applyBrightnessOverlay( newBg, bgBrightness );
			}
		}

		const oldBg = container.querySelector( '.ff-bg-layer-inner' );

		// No animation on first render or when explicitly skipped
		if ( ! oldBg || ! animate ) {
			container.innerHTML = '';
			container.appendChild( newBg );
			return;
		}

		// Cross-fade: fade new in while fading old out
		newBg.style.opacity    = '0';
		newBg.style.transition = `opacity ${ BG_FADE }ms ease`;
		container.appendChild( newBg );

		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				newBg.style.opacity    = '1';
				oldBg.style.transition = `opacity ${ BG_FADE }ms ease`;
				oldBg.style.opacity    = '0';
				setTimeout( () => {
					if ( oldBg.parentNode ) oldBg.remove();
				}, BG_FADE + 50 );
			} );
		} );
	}

	// ── Progress bar ──────────────────────────────────────────────────────────

	_updateProgress() {
		const el = this._progressEl;
		if ( ! el ) return;

		const total   = this._questions.length;
		const isQ     = this.state.currentScreen === 'question';
		const current = isQ ? this.state.currentIndex + 1 : 0;

		el.style.display = ( total > 1 && isQ ) ? '' : 'none';

		const bar   = el.querySelector( '.ff-progress-bar' );
		const label = el.querySelector( '.ff-progress-label' );
		if ( bar )   bar.style.width = `${ ( current / total ) * 100 }%`;
		if ( label ) label.textContent = `${ current } / ${ total }`;
	}

	// ── Nav bar state ─────────────────────────────────────────────────────────

	_updateNav() {
		if ( ! this._navEl ) return;

		const isQ    = this.state.currentScreen === 'question';
		const isFirst = isQ && this.state.currentIndex === 0;
		const isLast  = isQ && this._isLastQuestion();

		// Show nav only during question screens
		this._navEl.style.display = isQ ? '' : 'none';
		if ( ! isQ ) return;

		// Prev: disabled (not hidden) on first question
		this._prevBtn.disabled = isFirst;
		this._prevBtn.classList.toggle( 'ff-btn-nav--disabled', isFirst );

		// Next: disabled (not hidden) on last question
		// (submit is done via the OK/Submit button in the content area)
		this._nextBtn.disabled = isLast;
		this._nextBtn.classList.toggle( 'ff-btn-nav--disabled', isLast );

		const label = this._nextBtn.querySelector( '.ff-nav-next-label' );
		if ( label ) label.textContent = 'Next';
	}

	// ── State helpers ─────────────────────────────────────────────────────────

	_setState( patch ) {
		Object.assign( this.state, patch );
		this._updateProgress();
		this._updateNav();
		this._paintBackground( true );
		this._transitionScreen();
	}

	_currentQuestion() {
		return this._questions[ this.state.currentIndex ] ?? null;
	}

	_isLastQuestion() {
		return this.state.currentIndex === this._questions.length - 1;
	}

	// ── Navigation ────────────────────────────────────────────────────────────

	_goToQuestion( index, dir = 'forward' ) {
		this._lastDir = dir;
		this._setState( { currentScreen: 'question', currentIndex: index, errors: {} } );
	}

	_advance() {
		const q      = this._currentQuestion();
		const answer = q ? this.state.answers[ q.id ] : undefined;
		const error  = q ? validate( q, answer, this.state.previewMode ) : null;

		if ( error ) {
			this._setError( q.id, error );
			return;
		}

		const nextIndex = this.state.currentIndex + 1;
		if ( nextIndex < this._questions.length ) {
			this._goToQuestion( nextIndex, 'forward' );
		} else {
			this._submit();
		}
	}

	/**
	 * Inject a validation error in-place — no re-render, no slide.
	 */
	_setError( questionId, message ) {
		this.state.errors = { ...this.state.errors, [ questionId ]: message };

		const slot = this._contentWrapper.querySelector( '.ff-screen' );
		if ( ! slot ) return;

		let errorEl = slot.querySelector( '.ff-question-error' );
		if ( ! errorEl ) {
			errorEl = document.createElement( 'p' );
			errorEl.className = 'ff-question-error';
			const questionEl = slot.querySelector( '.ff-question' );
			if ( questionEl ) questionEl.appendChild( errorEl );
			else slot.querySelector( '.ff-screen-inner' )?.appendChild( errorEl );
		}
		errorEl.textContent   = message;
		errorEl.style.display = '';
	}

	_back() {
		if ( this.state.currentScreen === 'question' && this.state.currentIndex > 0 ) {
			this._goToQuestion( this.state.currentIndex - 1, 'back' );
		} else if ( this.state.currentScreen === 'question' && this.state.currentIndex === 0 ) {
			this._setState( { currentScreen: 'welcome', errors: {} } );
		}
	}

	_setAnswer( questionId, value ) {
		this.state.answers = { ...this.state.answers, [ questionId ]: value };

		if ( this.state.errors[ questionId ] ) {
			const errors = { ...this.state.errors };
			delete errors[ questionId ];
			this.state.errors = errors;

			const slot    = this._contentWrapper.querySelector( '.ff-screen' );
			const errorEl = slot?.querySelector( '.ff-question-error' );
			if ( errorEl ) errorEl.style.display = 'none';
		}
	}

	// ── Submission ────────────────────────────────────────────────────────────

	async _submit() {
		const { apiUrl, nonce } = window.flowformPublicData ?? {};
		const formId = Number( this.container.dataset.flowformId );

		this._lastDir = 'forward';
		this._setState( { currentScreen: 'thankYou', submitted: true } );

		try {
			const res = await fetch( `${ apiUrl }/forms/${ formId }/submit`, {
				method:  'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
				body:    JSON.stringify( { answers: this.state.answers } ),
			} );

			if ( ! res.ok ) {
				const body = await res.json().catch( () => ({}) );
				if ( res.status === 422 && body.errors ) {
					const firstErrId = Object.keys( body.errors )[ 0 ];
					const idx = this._questions.findIndex( ( q ) => q.id === firstErrId );
					this._setState( {
						currentScreen: 'question',
						currentIndex:  idx >= 0 ? idx : 0,
						errors:        body.errors,
						submitted:     false,
					} );
				}
			}
		} catch ( _err ) { /* stay on thank-you */ }
	}

	// ── Rendering ─────────────────────────────────────────────────────────────

	/** First render only — no exit animation. */
	_renderScreenImmediate() {
		const slot = document.createElement( 'div' );
		slot.className = 'ff-screen';
		this._buildScreen( slot );
		this._contentWrapper.appendChild( slot );
		this._animateEntry( slot );
	}

	/**
	 * Subsequent renders:
	 *  1. Play exit on old screen
	 *  2. Short gap
	 *  3. Render new screen with staggered entry
	 */
	_transitionScreen() {
		const wrapper = this._contentWrapper;
		const prev    = wrapper.querySelector( '.ff-screen' );

		if ( ! prev ) {
			this._renderScreenImmediate();
			return;
		}

		this._transitioning = true;

		this._animateExit( prev, () => {
			setTimeout( () => {
				prev.remove();

				const next = document.createElement( 'div' );
				next.className = 'ff-screen';
				this._buildScreen( next );
				wrapper.appendChild( next );
				this._animateEntry( next );

				this._transitioning = false;
			}, EXIT_GAP );
		} );
	}

	_buildScreen( slot ) {
		slot.innerHTML = '';
		const inner = document.createElement( 'div' );
		inner.className = 'ff-screen-inner';
		slot.appendChild( inner );

		switch ( this.state.currentScreen ) {
			case 'welcome':   this._renderWelcome( inner );   break;
			case 'question':  this._renderQuestion( inner );  break;
			case 'thankYou':  this._renderThankYou( inner );  break;
		}
	}

	// ── Entry animation ───────────────────────────────────────────────────────

	/**
	 * Each direct child of .ff-screen-inner gets the ff-entry CSS animation
	 * with a progressively increasing delay so they cascade in.
	 */
	_animateEntry( slot ) {
		const inner = slot.querySelector( '.ff-screen-inner' );
		if ( ! inner ) return;

		Array.from( inner.children ).forEach( ( el, i ) => {
			el.classList.add( 'ff-entry' );
			el.style.animationDelay = `${ i * ENTRY_STAGGER }ms`;
		} );
	}

	// ── Exit animation ────────────────────────────────────────────────────────

	/**
	 * Slide all .ff-screen-inner children down + fade out simultaneously,
	 * then call onDone when finished.
	 */
	_animateExit( slot, onDone ) {
		const inner = slot.querySelector( '.ff-screen-inner' );
		if ( ! inner ) {
			setTimeout( onDone, EXIT_DURATION );
			return;
		}

		inner.classList.add( 'ff-exit' );

		// Listen for animation end — use first animationend that fires
		let fired = false;
		const done = () => {
			if ( fired ) return;
			fired = true;
			onDone();
		};
		inner.addEventListener( 'animationend', done, { once: true } );
		setTimeout( done, EXIT_DURATION + 50 );
	}

	// ── Screen builders ───────────────────────────────────────────────────────

	_renderWelcome( inner ) {
		const c     = this._welcome?.content  ?? {};
		const s     = this._welcome?.settings ?? {};
		const align = ( s.layout && s.layout !== 'default' )
			? s.layout : ( this._design.alignment ?? 'center' );

		inner.className += ` ff-align-${ align }`;

		if ( c.title ) {
			const h1 = document.createElement( 'h1' );
			h1.className   = 'ff-title';
			h1.textContent = c.title;
			inner.appendChild( h1 );
		}

		if ( c.description ) {
			const p = document.createElement( 'p' );
			p.className   = 'ff-desc';
			p.textContent = c.description;
			inner.appendChild( p );
		}

		const btn = document.createElement( 'button' );
		btn.type        = 'button';
		btn.className   = 'ff-btn-primary';
		btn.textContent = c.buttonLabel || 'Start';
		btn.addEventListener( 'click', () => {
			this._lastDir = 'forward';
			if ( this._questions.length > 0 ) this._goToQuestion( 0, 'forward' );
			else this._submit();
		} );
		inner.appendChild( btn );
	}

	_renderQuestion( inner ) {
		const q      = this._currentQuestion();
		if ( ! q ) return;

		const align  = this._design.alignment ?? 'center';
		const isLast = this._isLastQuestion();

		inner.className += ` ff-align-${ align }`;

		// Question block — treated as one entry-animated element
		const questionEl = renderQuestion(
			q,
			this.state.answers[ q.id ],
			this.state.errors[ q.id ] ?? null,
			this._design,
			( id, val ) => this._setAnswer( id, val )
		);
		inner.appendChild( questionEl );

		// OK button + hint — second entry-animated element after the question
		const actions = document.createElement( 'div' );
		actions.className = 'ff-actions';

		const okBtn = document.createElement( 'button' );
		okBtn.type      = 'button';
		okBtn.className = 'ff-btn-primary';

		if ( isLast ) {
			okBtn.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" ' +
				'width="16" height="16" style="margin-right:6px;flex-shrink:0" aria-hidden="true">' +
				'<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0' +
				'l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>' +
				'</svg>Submit';
		} else {
			okBtn.textContent = q.content?.buttonLabel || 'OK';
		}

		okBtn.addEventListener( 'click', () => {
			this._lastDir = 'forward';
			this._advance();
		} );
		actions.appendChild( okBtn );

		const hint = document.createElement( 'span' );
		hint.className   = 'ff-hint';
		hint.textContent = 'press Enter ↵';
		actions.appendChild( hint );

		inner.appendChild( actions );

		this._bindEnterKey( okBtn );
	}

	_renderThankYou( inner ) {
		const c     = this._thankYou?.content  ?? {};
		const s     = this._thankYou?.settings ?? {};
		const align = ( s.layout && s.layout !== 'default' )
			? s.layout : ( this._design.alignment ?? 'center' );

		inner.className += ` ff-align-${ align }`;

		const icon = document.createElement( 'div' );
		icon.className = 'ff-thankyou-icon';
		icon.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
			'stroke="currentColor" stroke-width="2" width="40" height="40" aria-hidden="true">' +
			'<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' +
			'</svg>';
		inner.appendChild( icon );

		const h1 = document.createElement( 'h1' );
		h1.className   = 'ff-title';
		h1.textContent = c.title || 'Thank you!';
		inner.appendChild( h1 );

		if ( c.description ) {
			const p = document.createElement( 'p' );
			p.className   = 'ff-desc';
			p.textContent = c.description;
			inner.appendChild( p );
		}
	}

	// ── Keyboard ──────────────────────────────────────────────────────────────

	_boundEnterHandler = null;

	_bindEnterKey( okBtn ) {
		if ( this._boundEnterHandler ) {
			document.removeEventListener( 'keydown', this._boundEnterHandler );
		}
		this._boundEnterHandler = ( e ) => {
			if ( e.key === 'Enter' && document.activeElement?.tagName !== 'TEXTAREA' ) {
				e.preventDefault();
				okBtn.click();
			}
		};
		document.addEventListener( 'keydown', this._boundEnterHandler );
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyBrightnessOverlay( el, brightness ) {
	if ( ! brightness ) return;
	const overlay = document.createElement( 'div' );
	overlay.className = 'ff-bg-overlay';
	overlay.style.backgroundColor = brightness < 0 ? 'rgb(0,0,0)' : 'rgb(255,255,255)';
	overlay.style.opacity = String( Math.abs( brightness ) / 100 );
	el.appendChild( overlay );
}
