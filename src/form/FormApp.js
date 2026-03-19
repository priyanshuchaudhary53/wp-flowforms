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
 *  • Nav bar (prev/next) fixed at bottom — never re-rendered.
 *    Prev disabled on first question; Next disabled on last question.
 *
 *  • Race-condition safety via _transitionGen (generation counter).
 *    Every call to _transitionScreen() increments the counter.  Every
 *    async callback (setTimeout, rAF) captures the generation at the time
 *    it was scheduled and bails out silently if the counter has moved on.
 *    This means rapid clicks always converge on the LAST requested state
 *    with no orphaned DOM elements or stale bg layers.
 *
 *  • Background changes are DEFERRED until AFTER the exit animation so the
 *    layout never shifts while old content is still visible.  The bg layer
 *    is fully replaced (not cross-faded) when the target changes — simpler
 *    and immune to fade-overlap glitches from rapid navigation.
 *
 *  • Screen transition sequence:
 *      1. Increment generation; capture target state.
 *      2. Abort any in-progress exit by immediately cleaning up old screens.
 *      3. Run exit animation on the current screen.
 *      4. After EXIT_DURATION + EXIT_GAP: check generation — if stale, bail.
 *      5. Replace bg layer (instant swap, no async fade).
 *      6. Remove old screen; render new screen with staggered entry animation.
 *
 *  • Required-field error injected in-place — no re-render, no animation.
 */

import { renderQuestion }                       from './QuestionRenderer.js';
import { validate }                             from './Validator.js';
import { applyDesignTokens, resolveBackground } from './designTokens.js';

// ── Timing constants (keep in sync with CSS) ──────────────────────────────────
const EXIT_DURATION = 260;   // ms — exit animation duration (ff-exit keyframe)
const EXIT_GAP      = 60;    // ms — pause after exit before new screen appears
const BG_FADE       = 380;   // ms — background cross-fade duration
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

		// Cached bg key for the layer currently in the DOM
		this._currentBgKey = null;

		// Separate generation counter for bg cross-fades — lets us cancel an
		// in-flight fade without disrupting the screen-transition generation.
		this._bgGen = 0;

		// Generation counter — incremented on every _transitionScreen() call.
		// Async callbacks capture their generation and bail if it's stale.
		this._transitionGen = 0;
	}

	// ── Boot ──────────────────────────────────────────────────────────────────

	boot() {
		applyDesignTokens( this.container, this._design );

		const isFullPage = this.container.dataset.ffMode === 'fullpage';
		if ( isFullPage ) {
			this.container.classList.add( 'ff-fullpage' );
			document.body.style.overflow = 'hidden';
		}

		this.container.innerHTML = '';

		// 1. Progress bar
		this._progressEl = document.createElement( 'div' );
		this._progressEl.className = 'ff-progress-fixed';
		this._progressEl.innerHTML =
			'<div class="ff-progress-track"><div class="ff-progress-bar"></div></div>' +
			'<span class="ff-progress-label"></span>';
		this.container.appendChild( this._progressEl );

		// 2. Background layer
		this._bgEl = document.createElement( 'div' );
		this._bgEl.className = 'ff-bg-layer';
		this.container.appendChild( this._bgEl );

		// 3. Content wrapper
		this._contentWrapper = document.createElement( 'div' );
		this._contentWrapper.className = 'ff-content-wrapper';
		this.container.appendChild( this._contentWrapper );

		// 4. Nav bar — permanent, fixed at bottom
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
			if ( this._prevBtn.disabled ) return;
			this._lastDir = 'back';
			this._back();
		} );
		this._nextBtn.addEventListener( 'click', () => {
			if ( this._nextBtn.disabled ) return;
			this._lastDir = 'forward';
			this._advance();
		} );

		// Initial render — instant bg, no exit animation
		this._updateProgress();
		this._stampBackground( this._resolveBgForState( this.state ) );
		this._renderScreenImmediate();
		this._updateNav();

		document.addEventListener( 'flowform:previewToggle', ( e ) => {
			this.state.previewMode = e.detail.skipRequired;
		} );

		window.addEventListener( 'message', ( e ) => {
			if ( e.data?.type === 'DESIGN_UPDATE' ) {
				this._design = e.data.design;
				applyDesignTokens( this.container, this._design );
				this._currentBgKey = null; // force repaint
				this._stampBackground( this._resolveBgForState( this.state ), false );
			}
		} );
	}

	// ── Background ────────────────────────────────────────────────────────────

	/**
	 * Resolve the background descriptor for a given state snapshot.
	 * Attaches a stable _key so we can skip repaints when nothing changed.
	 *
	 * @param  {Object} state  State snapshot (may differ from this.state during transition)
	 * @return {Object}
	 */
	_resolveBgForState( state ) {
		const screen = state.currentScreen === 'welcome'  ? this._welcome
		             : state.currentScreen === 'thankYou' ? this._thankYou
		             : this._questions[ state.currentIndex ] ?? null;

		const settings = screen?.settings ?? {};
		const resolved = resolveBackground( settings, this._design );

		resolved._key = [
			resolved.bgImage          ?? '',
			resolved.bgLayout         ?? '',
			resolved.bgPosition       ?? '',
			resolved.globalBg         ?? '',
			resolved.bgBrightness     ?? 0,
			resolved.globalBrightness ?? 0,
		].join( '|' );

		return resolved;
	}

	/**
	 * Replace the background layer, cross-fading when the image changes.
	 *
	 * Race-condition safe: increments _bgGen so any in-flight fade for a
	 * previous call is cancelled before we start.  The content-wrapper
	 * split classes are applied synchronously so layout is always correct
	 * at the moment this is called (after screen exit).
	 *
	 * @param {Object}  bg       Result of _resolveBgForState()
	 * @param {boolean} animate  Cross-fade when true; instant swap when false.
	 */
	_stampBackground( bg, animate = true ) {
		const bgChanged = bg._key !== this._currentBgKey;
		if ( ! bgChanged ) return;
		this._currentBgKey = bg._key;

		// Cancel any in-flight bg fade by advancing the bg generation
		const bgGen = ++this._bgGen;

		const { bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness } = bg;
		const isSplit   = bgLayout === 'split';
		const imageLeft = bgPosition !== 'right';

		// ── Update content-wrapper layout immediately (we're post-exit) ──────
		this._contentWrapper.classList.toggle(
			'ff-content-wrapper--split-left',
			isSplit && !! bgImage && imageLeft
		);
		this._contentWrapper.classList.toggle(
			'ff-content-wrapper--split-right',
			isSplit && !! bgImage && ! imageLeft
		);

		// ── Build new bg element ──────────────────────────────────────────────
		const newBg = document.createElement( 'div' );
		newBg.className = 'ff-bg-layer-inner';

		if ( isSplit ) {
			newBg.classList.add( 'ff-bg-layer--split' );

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
		} else {
			newBg.classList.add( 'ff-bg-layer--wallpaper' );

			if ( bgImage ) {
				newBg.style.backgroundImage    = `url(${ bgImage })`;
				newBg.style.backgroundSize     = 'cover';
				newBg.style.backgroundPosition = 'center';
				applyBrightnessOverlay( newBg, bgBrightness );
			}
		}

		// ── Swap bg layer ─────────────────────────────────────────────────────
		const container = this._bgEl;

		// Collect all existing inner elements — there may be more than one if a
		// previous rapid transition left orphans.  We'll fade them all out.
		// When there are none (initial render) the loop below is a no-op and
		// the new bg simply fades in from opacity 0 — giving the entry fade.
		// animate=false is reserved for instant design-update repaints only.
		const oldLayers = Array.from( container.querySelectorAll( '.ff-bg-layer-inner' ) );

		if ( ! animate ) {
			// Instant replace — used only by DESIGN_UPDATE handler
			container.innerHTML = '';
			container.appendChild( newBg );
			return;
		}

		// Freeze each old layer's current opacity and start fading it out
		oldLayers.forEach( ( old ) => {
			// Stop any transition already running on this element
			old.style.transition = 'none';
			// Force a reflow so the browser registers the transition:none
			// before we set the new transition + opacity.
			void old.offsetHeight; // eslint-disable-line no-void
			old.style.transition = `opacity ${ BG_FADE }ms ease`;
			old.style.opacity    = '0';
		} );

		// New layer starts invisible
		newBg.style.opacity    = '0';
		newBg.style.transition = 'none';
		container.appendChild( newBg );

		// Start new layer fade-in on next paint
		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				// Bail if a newer bg swap has already taken over
				if ( this._bgGen !== bgGen ) return;

				newBg.style.transition = `opacity ${ BG_FADE }ms ease`;
				newBg.style.opacity    = '1';

				// Remove old layers after fade completes
				const cleanup = setTimeout( () => {
					if ( this._bgGen !== bgGen ) return;
					oldLayers.forEach( ( old ) => {
						if ( old.parentNode ) old.remove();
					} );
				}, BG_FADE + 50 );

				// If a newer bg gen fires before our timeout, it will call
				// container.querySelectorAll and handle cleanup itself.
				// Store the timeout id so a superseding call can cancel it.
				this._bgFadeCleanupTimer = cleanup;
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

		const isQ     = this.state.currentScreen === 'question';
		const isFirst = isQ && this.state.currentIndex === 0;
		const isLast  = isQ && this._isLastQuestion();

		this._navEl.style.display = isQ ? '' : 'none';
		if ( ! isQ ) return;

		this._prevBtn.disabled = isFirst;
		this._prevBtn.classList.toggle( 'ff-btn-nav--disabled', isFirst );

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

	/** Initial render — stamp bg, no exit animation. */
	_renderScreenImmediate() {
		this._contentWrapper.innerHTML = '';

		const slot = document.createElement( 'div' );
		slot.className = 'ff-screen';
		this._buildScreen( slot );
		this._contentWrapper.appendChild( slot );
		this._animateEntry( slot, this._lastDir ?? 'forward' );
	}

	/**
	 * Transition to the current state:
	 *
	 *  1. Increment generation — any in-flight callbacks from previous
	 *     transitions will see a stale generation and bail out cleanly.
	 *  2. Snapshot the target bg for this transition.
	 *  3. Immediately abort any unfinished exit on old screens by removing
	 *     all stale .ff-screen elements except the most recent one.
	 *  4. Play exit animation on the one remaining previous screen.
	 *  5. After exit + gap: check generation; if still current → stamp bg
	 *     and render new screen.
	 */
	_transitionScreen() {
		// ── Step 1: new generation — invalidates all in-flight callbacks ──────
		const gen = ++this._transitionGen;

		// ── Step 2: snapshot bg for the incoming state ────────────────────────
		const incomingBg = this._resolveBgForState( this.state );

		const wrapper = this._contentWrapper;

		// ── Step 3: if no screen exists yet, render immediately ───────────────
		const screens = Array.from( wrapper.querySelectorAll( '.ff-screen' ) );
		if ( screens.length === 0 ) {
			this._stampBackground( incomingBg );
			this._renderScreenImmediate();
			return;
		}

		// ── Step 4: cull all screens except the last visible one ──────────────
		const prev = screens[ screens.length - 1 ];
		screens.slice( 0, -1 ).forEach( ( s ) => s.remove() );

		// Capture direction at the time this transition was scheduled
		const dir = this._lastDir ?? 'forward';

		// ── Step 5: exit + deferred render ────────────────────────────────────
		this._animateExit( prev, dir, () => {
			setTimeout( () => {
				if ( this._transitionGen !== gen ) return;

				this._stampBackground( incomingBg );

				prev.remove();

				const next = document.createElement( 'div' );
				next.className = 'ff-screen';
				this._buildScreen( next );
				wrapper.appendChild( next );
				this._animateEntry( next, dir );

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

	_animateEntry( slot, dir = 'forward' ) {
		const inner = slot.querySelector( '.ff-screen-inner' );
		if ( ! inner ) return;

		const entryClass = dir === 'back' ? 'ff-entry--down' : 'ff-entry--up';

		// For question screens, stagger header, input wrapper, and actions
		// independently so the title and field don't enter simultaneously.
		// For welcome / thank-you screens, stagger the direct children of inner.
		const isQuestion = !! inner.querySelector( '.ff-question' );

		let els;
		if ( isQuestion ) {
			// Collect: question header, question input wrap, actions div — in order
			els = [
				inner.querySelector( '.ff-question-header' ),
				inner.querySelector( '.ff-question-input' ),
				inner.querySelector( '.ff-actions' ),
			].filter( Boolean );
		} else {
			els = Array.from( inner.children );
		}

		els.forEach( ( el, i ) => {
			el.classList.add( entryClass );
			el.style.animationDelay = `${ i * ENTRY_STAGGER }ms`;
		} );
	}

	// ── Exit animation ────────────────────────────────────────────────────────

	_animateExit( slot, dir = 'forward', onDone ) {
		const inner = slot.querySelector( '.ff-screen-inner' );

		if ( ! inner ) {
			setTimeout( onDone, 0 );
			return;
		}

		// Remove any lingering entry animations so exit plays cleanly
		Array.from( inner.children ).forEach( ( el ) => {
			el.classList.remove( 'ff-entry--up', 'ff-entry--down' );
			el.style.animationDelay = '';
		} );

		// Forward nav → current screen exits upward
		// Backward nav → current screen exits downward
		inner.classList.add( dir === 'back' ? 'ff-exit--down' : 'ff-exit--up' );

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

		const questionEl = renderQuestion(
			q,
			this.state.answers[ q.id ],
			this.state.errors[ q.id ] ?? null,
			this._design,
			( id, val ) => this._setAnswer( id, val )
		);
		inner.appendChild( questionEl );

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
