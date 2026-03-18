/**
 * WP FlowForms — Public Form Renderer
 *
 * Entry point for the frontend form renderer bundle.
 * Compiled to build/form/index.js by webpack.config.js.
 *
 * Phase 1: stub — assets are enqueued and localized data is available.
 * Phase 2: FormApp, QuestionRenderer, Validator, Transitions will be wired in.
 */

// flowformPublicData is injected by FlowForms_Frontend::enqueue_renderer_assets()
// Shape:
//   {
//     apiUrl:      string   — REST API base URL
//     nonce:       string   — wp_rest nonce for authenticated requests
//     previewMode: boolean  — true when opened via builder preview URL
//     formIds:     number[] — IDs of forms present on this page
//   }

document.addEventListener( 'DOMContentLoaded', () => {
	const containers = document.querySelectorAll( '[data-flowform-id]' );

	if ( ! containers.length ) return;

	// Phase 2 will import and boot FormApp here.
	// For now log so we can verify assets are loading correctly.
	containers.forEach( ( el ) => {
		const id = el.dataset.flowformId;
		console.log( `[FlowForms] Container found for form #${ id } — renderer coming in Phase 2.` );
		el.innerHTML = `<p style="font-family:sans-serif;color:#6b7280;padding:24px;">Form #${ id } — renderer loading…</p>`;
	} );
} );

// Preview mode: wire up the skip-required toggle injected by render_full_page().
if ( window.flowformPublicData?.previewMode ) {
	document.addEventListener( 'DOMContentLoaded', () => {
		const toggle = document.getElementById( 'flowform-skip-required' );
		if ( toggle ) {
			toggle.addEventListener( 'change', ( e ) => {
				// Phase 2: broadcast to FormApp instances via a custom event.
				document.dispatchEvent(
					new CustomEvent( 'flowform:previewToggle', {
						detail: { skipRequired: e.target.checked },
					} )
				);
			} );
		}
	} );
}