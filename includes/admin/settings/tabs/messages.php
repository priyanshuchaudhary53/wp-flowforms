<?php

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Messages tab field definitions.
 *
 * Two sections, saved with a single Save Settings button:
 *  1. Buttons, Labels and Hints
 *  2. Error and Validation Messages
 *
 * Every user-facing string from the public form renderer lives here.
 * Field IDs are the option keys stored in wpff_settings.
 * Placeholder tokens like {min}, {limit}, {count} are replaced in JS at runtime.
 *
 * @since 1.0.0
 */
return [

	// Section 1: Buttons, Labels and Hints

	'buttons-labels-heading' => [
		'type'  => 'heading',
		'label' => __( 'Buttons, Labels and Hints', 'wpflowforms' ),
		'desc'  => __( 'Button text, input labels and UI hints shown throughout the form.', 'wpflowforms' ),
	],

	'form-submit-label' => [
		'type'    => 'text',
		'label'   => __( 'Submit Button Text', 'wpflowforms' ),
		'desc'    => __( 'Text shown on the final submit button.', 'wpflowforms' ),
		'default' => __( 'Submit', 'wpflowforms' ),
	],

	'form-submitting-label' => [
		'type'    => 'text',
		'label'   => __( 'Submitting State Text', 'wpflowforms' ),
		'desc'    => __( 'Shown while the form is being submitted.', 'wpflowforms' ),
		'default' => __( 'Submitting...', 'wpflowforms' ),
	],

	'form-start-label' => [
		'type'    => 'text',
		'label'   => __( 'Start Button Text', 'wpflowforms' ),
		'desc'    => __( 'Default text for the Start button on the welcome screen when no per-form label is set.', 'wpflowforms' ),
		'default' => __( 'Start', 'wpflowforms' ),
	],

	'form-ok-label' => [
		'type'    => 'text',
		'label'   => __( 'OK Button Text', 'wpflowforms' ),
		'desc'    => __( 'Default text for the OK / Next button on each question when no per-question label is set.', 'wpflowforms' ),
		'default' => __( 'OK', 'wpflowforms' ),
	],

	'form-try-again-label' => [
		'type'    => 'text',
		'label'   => __( 'Try Again Button Text', 'wpflowforms' ),
		'desc'    => __( 'Text for the retry button shown on the submission error screen.', 'wpflowforms' ),
		'default' => __( 'Try again', 'wpflowforms' ),
	],

	'form-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Press Enter Hint', 'wpflowforms' ),
		'desc'    => __( 'Keyboard shortcut hint shown below each question.', 'wpflowforms' ),
		'default' => __( 'press Enter ↵', 'wpflowforms' ),
	],

	'form-shift-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Shift + Enter Hint', 'wpflowforms' ),
		'desc'    => __( 'Line-break hint shown below long text (textarea) questions.', 'wpflowforms' ),
		'default' => __( 'Shift ⇧ + Enter ↵ to make a line break', 'wpflowforms' ),
	],

	'nav-previous-label' => [
		'type'    => 'text',
		'label'   => __( 'Previous Button Label', 'wpflowforms' ),
		'desc'    => __( 'Accessible label for the Previous navigation button (screen-reader text).', 'wpflowforms' ),
		'default' => __( 'Previous', 'wpflowforms' ),
	],

	'nav-next-label' => [
		'type'    => 'text',
		'label'   => __( 'Next Button Label', 'wpflowforms' ),
		'desc'    => __( 'Accessible label for the Next navigation button (screen-reader text).', 'wpflowforms' ),
		'default' => __( 'Next', 'wpflowforms' ),
	],

	'form-thankyou-title' => [
		'type'    => 'text',
		'label'   => __( 'Thank You Title (fallback)', 'wpflowforms' ),
		'desc'    => __( 'Default thank-you screen title when no per-form title is set.', 'wpflowforms' ),
		'default' => __( 'Thank you!', 'wpflowforms' ),
	],

	'form-loading' => [
		'type'    => 'text',
		'label'   => __( 'Loading Text', 'wpflowforms' ),
		'desc'    => __( 'Shown while the form is being fetched.', 'wpflowforms' ),
		'default' => __( 'Loading form…', 'wpflowforms' ),
	],

	'form-redirecting-in' => [
		'type'    => 'text',
		'label'   => __( 'Redirect Countdown', 'wpflowforms' ),
		'desc'    => __( 'Countdown shown on the thank-you screen before a redirect. Use {seconds} as a placeholder.', 'wpflowforms' ),
		'default' => __( 'Redirecting in {seconds}…', 'wpflowforms' ),
	],

	'form-redirecting' => [
		'type'    => 'text',
		'label'   => __( 'Redirecting Text', 'wpflowforms' ),
		'desc'    => __( 'Shown when the redirect countdown reaches zero.', 'wpflowforms' ),
		'default' => __( 'Redirecting…', 'wpflowforms' ),
	],

	'input-text-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Text / Long Text Placeholder', 'wpflowforms' ),
		'desc'    => __( 'Default placeholder for short text and long text fields when no per-field placeholder is set.', 'wpflowforms' ),
		'default' => __( 'Your answer here…', 'wpflowforms' ),
	],

	'input-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Email Placeholder', 'wpflowforms' ),
		'desc'    => __( 'Default placeholder for email fields when no per-field placeholder is set.', 'wpflowforms' ),
		'default' => __( 'name@example.com', 'wpflowforms' ),
	],

	'input-confirm-email-label' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Label', 'wpflowforms' ),
		'desc'    => __( 'Label shown above the second email input in confirm-email mode.', 'wpflowforms' ),
		'default' => __( 'Confirm email', 'wpflowforms' ),
	],

	'input-confirm-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Placeholder', 'wpflowforms' ),
		'desc'    => __( 'Placeholder for the confirmation email input.', 'wpflowforms' ),
		'default' => __( 'Confirm your email', 'wpflowforms' ),
	],

	'input-other-label' => [
		'type'    => 'text',
		'label'   => __( '"Other" Option Label', 'wpflowforms' ),
		'desc'    => __( 'Label for the "Other" option in multiple choice and checkbox questions.', 'wpflowforms' ),
		'default' => __( 'Other', 'wpflowforms' ),
	],

	'input-other-placeholder' => [
		'type'    => 'text',
		'label'   => __( '"Other" Input Placeholder', 'wpflowforms' ),
		'desc'    => __( 'Placeholder inside the inline text input that appears when "Other" is selected.', 'wpflowforms' ),
		'default' => __( 'Type your answer…', 'wpflowforms' ),
	],

	'input-other-confirm' => [
		'type'    => 'text',
		'label'   => __( '"Other" Confirm Button Label', 'wpflowforms' ),
		'desc'    => __( 'Accessible label for the tick button that confirms the "Other" free-text answer.', 'wpflowforms' ),
		'default' => __( 'Confirm', 'wpflowforms' ),
	],

	'input-rating-label' => [
		'type'    => 'text',
		'label'   => __( 'Rating Button Aria Label', 'wpflowforms' ),
		'desc'    => __( 'Accessible label for each star button. Use {value} for the star number and {max} for the total.', 'wpflowforms' ),
		'default' => __( 'Rate {value} out of {max}', 'wpflowforms' ),
	],

	'input-yes-label' => [
		'type'    => 'text',
		'label'   => __( 'Yes Button (fallback)', 'wpflowforms' ),
		'desc'    => __( 'Default label for the Yes button when no per-form label is set.', 'wpflowforms' ),
		'default' => __( 'Yes', 'wpflowforms' ),
	],

	'input-no-label' => [
		'type'    => 'text',
		'label'   => __( 'No Button (fallback)', 'wpflowforms' ),
		'desc'    => __( 'Default label for the No button when no per-form label is set.', 'wpflowforms' ),
		'default' => __( 'No', 'wpflowforms' ),
	],

	'form-share-label' => [
		'type'    => 'text',
		'label'   => __( 'Share This Form Label', 'wpflowforms' ),
		'desc'    => __( 'Heading shown above the social share buttons on the thank-you screen.', 'wpflowforms' ),
		'default' => __( 'Share this form', 'wpflowforms' ),
	],

	'form-share-on' => [
		'type'    => 'text',
		'label'   => __( 'Share On Aria Label', 'wpflowforms' ),
		'desc'    => __( 'Accessible label for social share buttons. Use {network} as a placeholder for the network name.', 'wpflowforms' ),
		'default' => __( 'Share on {network}', 'wpflowforms' ),
	],

	'form-share-title' => [
		'type'    => 'text',
		'label'   => __( 'Share Title Fallback', 'wpflowforms' ),
		'desc'    => __( 'Default text used as the share title when the thank-you screen has no title set.', 'wpflowforms' ),
		'default' => __( 'Check this out!', 'wpflowforms' ),
	],

	// Section 2: Error and Validation Messages

	'error-validation-heading' => [
		'type'  => 'heading',
		'label' => __( 'Error and Validation Messages', 'wpflowforms' ),
		'desc'  => __( 'Messages shown when form input fails validation or a submission cannot be completed.', 'wpflowforms' ),
	],

	'validation-required' => [
		'type'    => 'text',
		'label'   => __( 'Required Field', 'wpflowforms' ),
		'desc'    => __( 'Shown when a required question is left blank.', 'wpflowforms' ),
		'default' => __( 'This field is required.', 'wpflowforms' ),
	],

	'validation-email' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Email', 'wpflowforms' ),
		'desc'    => __( 'Shown when an email address fails format validation.', 'wpflowforms' ),
		'default' => __( 'Please enter a valid email address.', 'wpflowforms' ),
	],

	'validation-email-mismatch' => [
		'type'    => 'text',
		'label'   => __( 'Email Mismatch', 'wpflowforms' ),
		'desc'    => __( 'Shown when the confirmation email does not match the first email field.', 'wpflowforms' ),
		'default' => __( 'Email addresses do not match.', 'wpflowforms' ),
	],

	'validation-number' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Number', 'wpflowforms' ),
		'desc'    => __( 'Shown when a number field contains non-numeric input.', 'wpflowforms' ),
		'default' => __( 'Please enter a valid number.', 'wpflowforms' ),
	],

	'validation-number-min' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Small', 'wpflowforms' ),
		'desc'    => __( 'Shown when a number is below the minimum. Use {min} as a placeholder for the minimum value.', 'wpflowforms' ),
		'default' => __( 'Value must be at least {min}.', 'wpflowforms' ),
	],

	'validation-number-max' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Large', 'wpflowforms' ),
		'desc'    => __( 'Shown when a number exceeds the maximum. Use {max} as a placeholder for the maximum value.', 'wpflowforms' ),
		'default' => __( 'Value must be at most {max}.', 'wpflowforms' ),
	],

	'validation-maxlength' => [
		'type'    => 'text',
		'label'   => __( 'Max Length Exceeded', 'wpflowforms' ),
		'desc'    => __( 'Shown when text exceeds the character limit. Use {limit} as a placeholder for the limit.', 'wpflowforms' ),
		'default' => __( 'Please enter no more than {limit} characters.', 'wpflowforms' ),
	],

	'validation-rating' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Rating', 'wpflowforms' ),
		'desc'    => __( 'Shown when a rating field has an out-of-range or missing value.', 'wpflowforms' ),
		'default' => __( 'Please select a valid rating.', 'wpflowforms' ),
	],

	'validation-selection' => [
		'type'    => 'text',
		'label'   => __( 'No Selection Made', 'wpflowforms' ),
		'desc'    => __( 'Shown when a multiple choice or checkbox question has no option selected.', 'wpflowforms' ),
		'default' => __( 'Please make a selection.', 'wpflowforms' ),
	],

	'validation-checkboxes-min' => [
		'type'    => 'text',
		'label'   => __( 'Too Few Selections', 'wpflowforms' ),
		'desc'    => __( 'Shown when fewer than the minimum number of checkboxes are selected. Use {count} as a placeholder for the minimum.', 'wpflowforms' ),
		'default' => __( 'Please select at least {count} options.', 'wpflowforms' ),
	],

	'validation-checkboxes-max' => [
		'type'    => 'text',
		'label'   => __( 'Too Many Selections', 'wpflowforms' ),
		'desc'    => __( 'Shown when more than the maximum number of checkboxes are selected. Use {count} as a placeholder for the maximum.', 'wpflowforms' ),
		'default' => __( 'Please select at most {count} options.', 'wpflowforms' ),
	],

	'validation-yesno' => [
		'type'    => 'text',
		'label'   => __( 'Yes / No Not Answered', 'wpflowforms' ),
		'desc'    => __( 'Shown when a yes/no question has no answer selected.', 'wpflowforms' ),
		'default' => __( 'Please select yes or no.', 'wpflowforms' ),
	],

	'form-submission-failed' => [
		'type'    => 'text',
		'label'   => __( 'Submission Failed Heading', 'wpflowforms' ),
		'desc'    => __( 'Heading shown on the error screen when a submission fails.', 'wpflowforms' ),
		'default' => __( 'Submission failed', 'wpflowforms' ),
	],

	'form-error-message' => [
		'type'    => 'text',
		'label'   => __( 'Generic Error Message', 'wpflowforms' ),
		'desc'    => __( 'Shown when a submission fails due to a server or network error.', 'wpflowforms' ),
		'default' => __( 'Something went wrong. Please try again.', 'wpflowforms' ),
	],

	'form-spam-message' => [
		'type'    => 'text',
		'label'   => __( 'Spam Detection Message', 'wpflowforms' ),
		'desc'    => __( 'Shown when a submission is rejected by the honeypot or token checks.', 'wpflowforms' ),
		'default' => __( 'Your submission could not be processed. Please reload the page and try again.', 'wpflowforms' ),
	],

	'form-load-error' => [
		'type'    => 'text',
		'label'   => __( 'Form Load Error', 'wpflowforms' ),
		'desc'    => __( 'Shown when the form cannot be fetched from the server.', 'wpflowforms' ),
		'default' => __( 'Sorry, this form could not be loaded. Please try again later.', 'wpflowforms' ),
	],

];
