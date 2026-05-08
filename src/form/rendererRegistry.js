/**
 * Renderer Extension Registry
 *
 * Allows Pro (and other add-ons) to register custom field renderers,
 * validators, sanitizers, and middleware for the public form renderer.
 *
 * @since 1.2.0
 */

const fieldRenderers = {};
const fieldValidators = {};
const fieldSanitizers = {};
const navigationMiddleware = [];
const submitMiddleware = [];
const answerPipeHandlers = [];

/**
 * Registers a custom renderer function for a field type.
 *
 * @since 1.2.0
 *
 * @param {string}   type     Field type identifier (e.g. 'matrix').
 * @param {Function} renderFn Called with (container, question, answer, onAnswer) to render the field UI.
 */
export function registerFieldRenderer(type, renderFn) { fieldRenderers[type] = renderFn; }

/**
 * Registers a custom validation function for a field type.
 *
 * @since 1.2.0
 *
 * @param {string}   type       Field type identifier.
 * @param {Function} validateFn Called with (answer, question) — returns true if valid, or an error string.
 */
export function registerFieldValidator(type, validateFn) { fieldValidators[type] = validateFn; }

/**
 * Registers a custom sanitization function for a field type.
 *
 * @since 1.2.0
 *
 * @param {string}   type       Field type identifier.
 * @param {Function} sanitizeFn Called with (answer, question) — returns the sanitized answer value.
 */
export function registerFieldSanitizer(type, sanitizeFn) { fieldSanitizers[type] = sanitizeFn; }

/**
 * Registers middleware that runs during question navigation.
 *
 * @since 1.2.0
 *
 * @param {Function} fn Called with ({ from, to, answers, questions }) — can modify or block navigation.
 */
export function registerNavigationMiddleware(fn) { navigationMiddleware.push(fn); }

/**
 * Registers middleware that runs before form submission.
 *
 * @since 1.2.0
 *
 * @param {Function} fn Called with ({ answers, questions }) — can modify answers or abort submission.
 */
export function registerSubmitMiddleware(fn) { submitMiddleware.push(fn); }

/**
 * Registers a handler for answer piping (inserting previous answers into later questions).
 *
 * @since 1.2.0
 *
 * @param {Function} fn Called with (text, answers) — returns the processed text with piped values.
 */
export function registerAnswerPipeHandler(fn) { answerPipeHandlers.push(fn); }

/**
 * Returns the registered renderer for a field type, or null.
 *
 * @since 1.2.0
 *
 * @param {string} type Field type identifier.
 * @return {Function|null}
 */
export function getFieldRenderer(type) { return fieldRenderers[type] ?? null; }

/**
 * Returns the registered validator for a field type, or null.
 *
 * @since 1.2.0
 *
 * @param {string} type Field type identifier.
 * @return {Function|null}
 */
export function getFieldValidator(type) { return fieldValidators[type] ?? null; }

/**
 * Returns the registered sanitizer for a field type, or null.
 *
 * @since 1.2.0
 *
 * @param {string} type Field type identifier.
 * @return {Function|null}
 */
export function getFieldSanitizer(type) { return fieldSanitizers[type] ?? null; }

/**
 * Returns a shallow copy of all registered navigation middleware.
 *
 * @since 1.2.0
 *
 * @return {Function[]}
 */
export function getNavigationMiddleware() { return [...navigationMiddleware]; }

/**
 * Returns a shallow copy of all registered submit middleware.
 *
 * @since 1.2.0
 *
 * @return {Function[]}
 */
export function getSubmitMiddleware() { return [...submitMiddleware]; }

/**
 * Returns a shallow copy of all registered answer pipe handlers.
 *
 * @since 1.2.0
 *
 * @return {Function[]}
 */
export function getAnswerPipeHandlers() { return [...answerPipeHandlers]; }
