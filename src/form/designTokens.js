/**
 * WP FlowForms — Design Tokens
 *
 * Injects a <style> tag with CSS custom properties scoped to a specific form
 * container by its unique data-flowform-id attribute.  Mirrors the inline
 * style object set on the canvas root in the React builder so every design
 * change from the builder is reflected identically in the public renderer.
 *
 * Also exports resolveBackground() — a direct port of the same function used
 * in Canvas.jsx so background logic stays in one place per language.
 */

// ── Font scale ────────────────────────────────────────────────────────────────
// Mirrors src/builder/components/design/fontScale.js exactly.

const FONT_SCALE = {
	small: {
		title:    '1.875rem',
		subtitle: '1.25rem',
		body:     '0.875rem',
		hint:     '0.75rem',
	},
	regular: {
		title:    '2.25rem',
		subtitle: '1.5rem',
		body:     '1rem',
		hint:     '0.875rem',
	},
	large: {
		title:    '2.75rem',
		subtitle: '1.75rem',
		body:     '1.125rem',
		hint:     '1rem',
	},
};

function getFontScale( key ) {
	return FONT_SCALE[ key ] ?? FONT_SCALE.regular;
}

// ── Default design values ─────────────────────────────────────────────────────
// Mirrors the defaults in designSettings.js so the renderer looks correct
// even for forms that were saved before any design customisation.

const DESIGN_DEFAULTS = {
	bg_color:           '#ffffff',
	title_color:        '#111827',
	description_color:  '#6b7280',
	answer_color:       '#111827',
	button_color:       '#111827',
	button_hover_color: '#374151',
	button_text_color:  '#ffffff',
	hint_color:         '#9ca3af',
	star_color:         '#f59e0b',
	alignment:          'center',
	border_radius:      'rounded',
	font_size:          'regular',
	google_font:        '',
};

// ── applyDesignTokens ─────────────────────────────────────────────────────────

/**
 * Inject (or replace) a <style> block that sets all CSS custom properties
 * scoped to the given container element via its [data-flowform-id] selector.
 *
 * This function is safe to call multiple times — it always replaces the
 * previous style block so there are no duplicates.
 *
 * @param {HTMLElement} container  The [data-flowform-id] div.
 * @param {Object}      design     The design object from form JSON.
 */
export function applyDesignTokens( container, design ) {
	const d  = { ...DESIGN_DEFAULTS, ...design };
	const id = container.dataset.flowformId;

	if ( ! id ) return;

	// Google Font
	if ( d.google_font ) {
		loadGoogleFont( d.google_font );
	}

	// Corner radius
	const cornerRadius = d.border_radius === 'angular'
		? '0px'
		: d.border_radius === 'full'
		? '9999px'
		: '8px';

	// Font scale
	const scale = getFontScale( d.font_size );

	const selector = `[data-flowform-id="${ id }"]`;

	const css = `
${ selector } {
  background-color:  ${ d.bg_color };
  font-family:       ${ d.google_font ? `"${ d.google_font }", sans-serif` : 'inherit' };

  --btn-color:        ${ d.button_color };
  --btn-hover-color:  ${ d.button_hover_color };
  --btn-text-color:   ${ d.button_text_color };
  --title-color:      ${ d.title_color };
  --desc-color:       ${ d.description_color };
  --answer-color:     ${ d.answer_color };
  --hint-color:       ${ d.hint_color };
  --star-color:       ${ d.star_color };
  --corner-radius:    ${ cornerRadius };

  --fs-title:         ${ scale.title };
  --fs-subtitle:      ${ scale.subtitle };
  --fs-body:          ${ scale.body };
  --fs-hint:          ${ scale.hint };
}`;

	// Replace the existing style tag for this form, or create a new one.
	const styleId = `ff-design-${ id }`;
	let styleEl   = document.getElementById( styleId );

	if ( ! styleEl ) {
		styleEl    = document.createElement( 'style' );
		styleEl.id = styleId;
		document.head.appendChild( styleEl );
	}

	styleEl.textContent = css;

	// Also set bg_color directly on the container as a fallback for browsers
	// that paint before the <style> is applied.
	container.style.backgroundColor = d.bg_color;
}

// ── Google Font loader ────────────────────────────────────────────────────────

const _loadedFonts = new Set();

/**
 * Inject a Google Fonts <link> tag — safe to call multiple times.
 *
 * @param {string} fontName
 */
export function loadGoogleFont( fontName ) {
	if ( ! fontName || _loadedFonts.has( fontName ) ) return;
	_loadedFonts.add( fontName );

	const link  = document.createElement( 'link' );
	link.id     = `ff-font-${ fontName.replace( /\s+/g, '-' ) }`;
	link.rel    = 'stylesheet';
	link.href   = `https://fonts.googleapis.com/css2?family=${ encodeURIComponent( fontName ) }:wght@400;500;600;700&display=swap`;
	document.head.appendChild( link );
}

// ── resolveBackground ─────────────────────────────────────────────────────────
// Direct port of the function in src/builder/lib/resolveBackground.js.
// Kept here so the renderer has no dependency on the builder bundle.

/**
 * @param {Object} settings  Block/screen settings (backgroundImage, bgLayout, etc.)
 * @param {Object} design    Global design object (bg_image, bg_brightness).
 * @returns {{ bgImage, bgLayout, bgPosition, bgBrightness, globalBrightness, globalBg }}
 */
export function resolveBackground( settings, design ) {
	const localImage    = settings?.backgroundImage?.url ?? null;
	const globalImage   = design?.bg_image?.url          ?? null;
	const localBgLayout = settings?.bgLayout             ?? 'wallpaper';
	const bgPosition    = settings?.bgPosition           ?? 'left';

	const globalActive =
		!! globalImage && ( ! localImage || localBgLayout === 'split' );

	const bgImage =
		localBgLayout === 'split'
			? ( localImage || null )
			: localImage || ( globalActive ? globalImage : null );

	const bgBrightness = globalActive && ! localImage
		? ( design?.bg_brightness ?? 0 )
		: ( settings?.bgBrightness ?? 0 );

	const globalBrightness = design?.bg_brightness ?? 0;

	const globalBg =
		localBgLayout === 'split' && globalActive ? globalImage : null;

	return { bgImage, bgLayout: localBgLayout, bgPosition, bgBrightness, globalBrightness, globalBg };
}
