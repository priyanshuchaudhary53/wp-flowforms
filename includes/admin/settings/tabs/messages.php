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
		'label' => __( 'Buttons, Labels and Hints', 'wp-flowforms' ),
		'desc'  => __( 'Button text, input labels and UI hints shown throughout the form.', 'wp-flowforms' ),
	],

	'form-submit-label' => [
		'type'    => 'text',
		'label'   => __( 'Submit Button Text', 'wp-flowforms' ),
		'desc'    => __( 'Text shown on the final submit button.', 'wp-flowforms' ),
		'default' => __( 'Submit', 'wp-flowforms' ),
	],

	'form-submitting-label' => [
		'type'    => 'text',
		'label'   => __( 'Submitting State Text', 'wp-flowforms' ),
		'desc'    => __( 'Shown while the form is being submitted.', 'wp-flowforms' ),
		'default' => __( 'Submitting...', 'wp-flowforms' ),
	],

	'form-start-label' => [
		'type'    => 'text',
		'label'   => __( 'Start Button Text', 'wp-flowforms' ),
		'desc'    => __( 'Default text for the Start button on the welcome screen when no per-form label is set.', 'wp-flowforms' ),
		'default' => __( 'Start', 'wp-flowforms' ),
	],

	'form-ok-label' => [
		'type'    => 'text',
		'label'   => __( 'OK Button Text', 'wp-flowforms' ),
		'desc'    => __( 'Default text for the OK / Next button on each question when no per-question label is set.', 'wp-flowforms' ),
		'default' => __( 'OK', 'wp-flowforms' ),
	],

	'form-try-again-label' => [
		'type'    => 'text',
		'label'   => __( 'Try Again Button Text', 'wp-flowforms' ),
		'desc'    => __( 'Text for the retry button shown on the submission error screen.', 'wp-flowforms' ),
		'default' => __( 'Try again', 'wp-flowforms' ),
	],

	'form-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Press Enter Hint', 'wp-flowforms' ),
		'desc'    => __( 'Keyboard shortcut hint shown below each question.', 'wp-flowforms' ),
		'default' => __( 'press Enter ↵', 'wp-flowforms' ),
	],

	'form-shift-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Shift + Enter Hint', 'wp-flowforms' ),
		'desc'    => __( 'Line-break hint shown below long text (textarea) questions.', 'wp-flowforms' ),
		'default' => __( 'Shift ⇧ + Enter ↵ to make a line break', 'wp-flowforms' ),
	],

	'nav-previous-label' => [
		'type'    => 'text',
		'label'   => __( 'Previous Button Label', 'wp-flowforms' ),
		'desc'    => __( 'Accessible label for the Previous navigation button (screen-reader text).', 'wp-flowforms' ),
		'default' => __( 'Previous', 'wp-flowforms' ),
	],

	'nav-next-label' => [
		'type'    => 'text',
		'label'   => __( 'Next Button Label', 'wp-flowforms' ),
		'desc'    => __( 'Accessible label for the Next navigation button (screen-reader text).', 'wp-flowforms' ),
		'default' => __( 'Next', 'wp-flowforms' ),
	],

	'form-thankyou-title' => [
		'type'    => 'text',
		'label'   => __( 'Thank You Title (fallback)', 'wp-flowforms' ),
		'desc'    => __( 'Default thank-you screen title when no per-form title is set.', 'wp-flowforms' ),
		'default' => __( 'Thank you!', 'wp-flowforms' ),
	],

	'form-loading' => [
		'type'    => 'text',
		'label'   => __( 'Loading Text', 'wp-flowforms' ),
		'desc'    => __( 'Shown while the form is being fetched.', 'wp-flowforms' ),
		'default' => __( 'Loading form…', 'wp-flowforms' ),
	],

	'form-redirecting-in' => [
		'type'    => 'text',
		'label'   => __( 'Redirect Countdown', 'wp-flowforms' ),
		'desc'    => __( 'Countdown shown on the thank-you screen before a redirect. Use {seconds} as a placeholder.', 'wp-flowforms' ),
		'default' => __( 'Redirecting in {seconds}…', 'wp-flowforms' ),
	],

	'form-redirecting' => [
		'type'    => 'text',
		'label'   => __( 'Redirecting Text', 'wp-flowforms' ),
		'desc'    => __( 'Shown when the redirect countdown reaches zero.', 'wp-flowforms' ),
		'default' => __( 'Redirecting…', 'wp-flowforms' ),
	],

	'input-text-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Text / Long Text Placeholder', 'wp-flowforms' ),
		'desc'    => __( 'Default placeholder for short text and long text fields when no per-field placeholder is set.', 'wp-flowforms' ),
		'default' => __( 'Your answer here…', 'wp-flowforms' ),
	],

	'input-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Email Placeholder', 'wp-flowforms' ),
		'desc'    => __( 'Default placeholder for email fields when no per-field placeholder is set.', 'wp-flowforms' ),
		'default' => __( 'name@example.com', 'wp-flowforms' ),
	],

	'input-confirm-email-label' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Label', 'wp-flowforms' ),
		'desc'    => __( 'Label shown above the second email input in confirm-email mode.', 'wp-flowforms' ),
		'default' => __( 'Confirm email', 'wp-flowforms' ),
	],

	'input-confirm-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Placeholder', 'wp-flowforms' ),
		'desc'    => __( 'Placeholder for the confirmation email input.', 'wp-flowforms' ),
		'default' => __( 'Confirm your email', 'wp-flowforms' ),
	],

	'input-other-label' => [
		'type'    => 'text',
		'label'   => __( '"Other" Option Label', 'wp-flowforms' ),
		'desc'    => __( 'Label for the "Other" option in multiple choice and checkbox questions.', 'wp-flowforms' ),
		'default' => __( 'Other', 'wp-flowforms' ),
	],

	'input-other-placeholder' => [
		'type'    => 'text',
		'label'   => __( '"Other" Input Placeholder', 'wp-flowforms' ),
		'desc'    => __( 'Placeholder inside the inline text input that appears when "Other" is selected.', 'wp-flowforms' ),
		'default' => __( 'Type your answer…', 'wp-flowforms' ),
	],

	'input-other-confirm' => [
		'type'    => 'text',
		'label'   => __( '"Other" Confirm Button Label', 'wp-flowforms' ),
		'desc'    => __( 'Accessible label for the tick button that confirms the "Other" free-text answer.', 'wp-flowforms' ),
		'default' => __( 'Confirm', 'wp-flowforms' ),
	],

	'input-rating-label' => [
		'type'    => 'text',
		'label'   => __( 'Rating Button Aria Label', 'wp-flowforms' ),
		'desc'    => __( 'Accessible label for each star button. Use {value} for the star number and {max} for the total.', 'wp-flowforms' ),
		'default' => __( 'Rate {value} out of {max}', 'wp-flowforms' ),
	],

	'input-yes-label' => [
		'type'    => 'text',
		'label'   => __( 'Yes Button (fallback)', 'wp-flowforms' ),
		'desc'    => __( 'Default label for the Yes button when no per-form label is set.', 'wp-flowforms' ),
		'default' => __( 'Yes', 'wp-flowforms' ),
	],

	'input-no-label' => [
		'type'    => 'text',
		'label'   => __( 'No Button (fallback)', 'wp-flowforms' ),
		'desc'    => __( 'Default label for the No button when no per-form label is set.', 'wp-flowforms' ),
		'default' => __( 'No', 'wp-flowforms' ),
	],

	'form-share-label' => [
		'type'    => 'text',
		'label'   => __( 'Share This Form Label', 'wp-flowforms' ),
		'desc'    => __( 'Heading shown above the social share buttons on the thank-you screen.', 'wp-flowforms' ),
		'default' => __( 'Share this form', 'wp-flowforms' ),
	],

	'form-share-on' => [
		'type'    => 'text',
		'label'   => __( 'Share On Aria Label', 'wp-flowforms' ),
		'desc'    => __( 'Accessible label for social share buttons. Use {network} as a placeholder for the network name.', 'wp-flowforms' ),
		'default' => __( 'Share on {network}', 'wp-flowforms' ),
	],

	'form-share-title' => [
		'type'    => 'text',
		'label'   => __( 'Share Title Fallback', 'wp-flowforms' ),
		'desc'    => __( 'Default text used as the share title when the thank-you screen has no title set.', 'wp-flowforms' ),
		'default' => __( 'Check this out!', 'wp-flowforms' ),
	],

	// Section 2: Error and Validation Messages

	'error-validation-heading' => [
		'type'  => 'heading',
		'label' => __( 'Error and Validation Messages', 'wp-flowforms' ),
		'desc'  => __( 'Messages shown when form input fails validation or a submission cannot be completed.', 'wp-flowforms' ),
	],

	'validation-required' => [
		'type'    => 'text',
		'label'   => __( 'Required Field', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a required question is left blank.', 'wp-flowforms' ),
		'default' => __( 'This field is required.', 'wp-flowforms' ),
	],

	'validation-email' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Email', 'wp-flowforms' ),
		'desc'    => __( 'Shown when an email address fails format validation.', 'wp-flowforms' ),
		'default' => __( 'Please enter a valid email address.', 'wp-flowforms' ),
	],

	'validation-email-mismatch' => [
		'type'    => 'text',
		'label'   => __( 'Email Mismatch', 'wp-flowforms' ),
		'desc'    => __( 'Shown when the confirmation email does not match the first email field.', 'wp-flowforms' ),
		'default' => __( 'Email addresses do not match.', 'wp-flowforms' ),
	],

	'validation-number' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Number', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a number field contains non-numeric input.', 'wp-flowforms' ),
		'default' => __( 'Please enter a valid number.', 'wp-flowforms' ),
	],

	'validation-number-min' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Small', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a number is below the minimum. Use {min} as a placeholder for the minimum value.', 'wp-flowforms' ),
		'default' => __( 'Value must be at least {min}.', 'wp-flowforms' ),
	],

	'validation-number-max' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Large', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a number exceeds the maximum. Use {max} as a placeholder for the maximum value.', 'wp-flowforms' ),
		'default' => __( 'Value must be at most {max}.', 'wp-flowforms' ),
	],

	'validation-maxlength' => [
		'type'    => 'text',
		'label'   => __( 'Max Length Exceeded', 'wp-flowforms' ),
		'desc'    => __( 'Shown when text exceeds the character limit. Use {limit} as a placeholder for the limit.', 'wp-flowforms' ),
		'default' => __( 'Please enter no more than {limit} characters.', 'wp-flowforms' ),
	],

	'validation-rating' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Rating', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a rating field has an out-of-range or missing value.', 'wp-flowforms' ),
		'default' => __( 'Please select a valid rating.', 'wp-flowforms' ),
	],

	'validation-selection' => [
		'type'    => 'text',
		'label'   => __( 'No Selection Made', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a multiple choice or checkbox question has no option selected.', 'wp-flowforms' ),
		'default' => __( 'Please make a selection.', 'wp-flowforms' ),
	],

	'validation-checkboxes-min' => [
		'type'    => 'text',
		'label'   => __( 'Too Few Selections', 'wp-flowforms' ),
		'desc'    => __( 'Shown when fewer than the minimum number of checkboxes are selected. Use {count} as a placeholder for the minimum.', 'wp-flowforms' ),
		'default' => __( 'Please select at least {count} options.', 'wp-flowforms' ),
	],

	'validation-checkboxes-max' => [
		'type'    => 'text',
		'label'   => __( 'Too Many Selections', 'wp-flowforms' ),
		'desc'    => __( 'Shown when more than the maximum number of checkboxes are selected. Use {count} as a placeholder for the maximum.', 'wp-flowforms' ),
		'default' => __( 'Please select at most {count} options.', 'wp-flowforms' ),
	],

	'validation-yesno' => [
		'type'    => 'text',
		'label'   => __( 'Yes / No Not Answered', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a yes/no question has no answer selected.', 'wp-flowforms' ),
		'default' => __( 'Please select yes or no.', 'wp-flowforms' ),
	],

	'form-submission-failed' => [
		'type'    => 'text',
		'label'   => __( 'Submission Failed Heading', 'wp-flowforms' ),
		'desc'    => __( 'Heading shown on the error screen when a submission fails.', 'wp-flowforms' ),
		'default' => __( 'Submission failed', 'wp-flowforms' ),
	],

	'form-error-message' => [
		'type'    => 'text',
		'label'   => __( 'Generic Error Message', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a submission fails due to a server or network error.', 'wp-flowforms' ),
		'default' => __( 'Something went wrong. Please try again.', 'wp-flowforms' ),
	],

	'form-spam-message' => [
		'type'    => 'text',
		'label'   => __( 'Spam Detection Message', 'wp-flowforms' ),
		'desc'    => __( 'Shown when a submission is rejected by the honeypot or token checks.', 'wp-flowforms' ),
		'default' => __( 'Your submission could not be processed. Please reload the page and try again.', 'wp-flowforms' ),
	],

	'form-load-error' => [
		'type'    => 'text',
		'label'   => __( 'Form Load Error', 'wp-flowforms' ),
		'desc'    => __( 'Shown when the form cannot be fetched from the server.', 'wp-flowforms' ),
		'default' => __( 'Sorry, this form could not be loaded. Please try again later.', 'wp-flowforms' ),
	],

];
