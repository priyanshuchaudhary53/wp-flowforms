/**
 * WP FlowForms — Public Form Renderer
 *
 * Entry point. Runs on DOMContentLoaded, finds every [data-flowform-id]
 * container, fetches the form JSON from the REST API, and boots a FormApp
 * instance into each one.
 *
 * flowformPublicData is injected by FlowForms_Frontend::enqueue_renderer_assets():
 * {
 *   apiUrl:      string    — REST API base URL
 *   nonce:       string    — wp_rest nonce
 *   previewMode: boolean   — true when opened via ?flowform_preview=1
 *   formIds:     number[]  — IDs flagged by shortcode / block / PHP template
 * }
 */

import './style.css';
import { FormApp } from './FormApp.js';

document.addEventListener( 'DOMContentLoaded', init );

async function init() {
	const containers = document.querySelectorAll( '[data-flowform-id]' );
	if ( ! containers.length ) return;

	const { apiUrl, nonce, previewMode = false } = window.flowformPublicData ?? {};

	if ( ! apiUrl ) {
		console.error( '[FlowForms] flowformPublicData.apiUrl is missing.' );
		return;
	}

	// Boot each container independently — multiple forms per page are supported.
	containers.forEach( ( container ) => {
		const formId = Number( container.dataset.flowformId );
		if ( ! formId ) return;
		bootForm( container, formId, apiUrl, nonce, previewMode );
	} );

	// Preview bar toggle — wired to flowform:previewToggle custom event.
	// FormApp instances listen for this event themselves (see FormApp.js).
	const toggle = document.getElementById( 'flowform-skip-required' );
	if ( toggle ) {
		toggle.addEventListener( 'change', ( e ) => {
			document.dispatchEvent(
				new CustomEvent( 'flowform:previewToggle', {
					detail: { skipRequired: e.target.checked },
				} )
			);
		} );
	}
}

/**
 * Fetch a single form from the REST API and boot a FormApp into the container.
 *
 * @param {HTMLElement} container
 * @param {number}      formId
 * @param {string}      apiUrl
 * @param {string}      nonce
 * @param {boolean}     previewMode
 */
async function bootForm( container, formId, apiUrl, nonce, previewMode ) {
	showLoading( container );

	try {
		const res = await fetch( `${ apiUrl }/forms/${ formId }/public`, {
			headers: { 'X-WP-Nonce': nonce },
		} );

		if ( ! res.ok ) throw new Error( `HTTP ${ res.status }` );

		const formData = await res.json();
		clearLoading( container );

		const app = new FormApp( container, formData, { previewMode } );
		app.boot();

	} catch ( err ) {
		showError( container, err );
	}
}

// ── Loading / error states ────────────────────────────────────────────────────

function showLoading( container ) {
	container.innerHTML = `
		<div class="ff-loading" role="status" aria-live="polite">
			<div class="ff-loading-spinner" aria-hidden="true"></div>
			<span class="ff-loading-text">Loading form\u2026</span>
		</div>`;
}

function clearLoading( container ) {
	container.innerHTML = '';
}

function showError( container, err ) {
	console.error( '[FlowForms] Failed to load form:', err );
	container.innerHTML = `
		<div class="ff-error" role="alert">
			<p>Sorry, this form could not be loaded. Please try again later.</p>
		</div>`;
}
