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
		'label' => __( 'Buttons, Labels and Hints', 'flowforms' ),
		'desc'  => __( 'Button text, input labels and UI hints shown throughout the form.', 'flowforms' ),
	],

	'form-submit-label' => [
		'type'    => 'text',
		'label'   => __( 'Submit Button Text', 'flowforms' ),
		'desc'    => __( 'Text shown on the final submit button.', 'flowforms' ),
		'default' => __( 'Submit', 'flowforms' ),
	],

	'form-submitting-label' => [
		'type'    => 'text',
		'label'   => __( 'Submitting State Text', 'flowforms' ),
		'desc'    => __( 'Shown while the form is being submitted.', 'flowforms' ),
		'default' => __( 'Submitting...', 'flowforms' ),
	],

	'form-start-label' => [
		'type'    => 'text',
		'label'   => __( 'Start Button Text', 'flowforms' ),
		'desc'    => __( 'Default text for the Start button on the welcome screen when no per-form label is set.', 'flowforms' ),
		'default' => __( 'Start', 'flowforms' ),
	],

	'form-ok-label' => [
		'type'    => 'text',
		'label'   => __( 'OK Button Text', 'flowforms' ),
		'desc'    => __( 'Default text for the OK / Next button on each question when no per-question label is set.', 'flowforms' ),
		'default' => __( 'OK', 'flowforms' ),
	],

	'form-try-again-label' => [
		'type'    => 'text',
		'label'   => __( 'Try Again Button Text', 'flowforms' ),
		'desc'    => __( 'Text for the retry button shown on the submission error screen.', 'flowforms' ),
		'default' => __( 'Try again', 'flowforms' ),
	],

	'form-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Press Enter Hint', 'flowforms' ),
		'desc'    => __( 'Keyboard shortcut hint shown below each question.', 'flowforms' ),
		'default' => __( 'press Enter ↵', 'flowforms' ),
	],

	'form-shift-enter-hint' => [
		'type'    => 'text',
		'label'   => __( 'Shift + Enter Hint', 'flowforms' ),
		'desc'    => __( 'Line-break hint shown below long text (textarea) questions.', 'flowforms' ),
		'default' => __( 'Shift ⇧ + Enter ↵ to make a line break', 'flowforms' ),
	],

	'nav-previous-label' => [
		'type'    => 'text',
		'label'   => __( 'Previous Button Label', 'flowforms' ),
		'desc'    => __( 'Accessible label for the Previous navigation button (screen-reader text).', 'flowforms' ),
		'default' => __( 'Previous', 'flowforms' ),
	],

	'nav-next-label' => [
		'type'    => 'text',
		'label'   => __( 'Next Button Label', 'flowforms' ),
		'desc'    => __( 'Accessible label for the Next navigation button (screen-reader text).', 'flowforms' ),
		'default' => __( 'Next', 'flowforms' ),
	],

	'form-thankyou-title' => [
		'type'    => 'text',
		'label'   => __( 'Thank You Title (fallback)', 'flowforms' ),
		'desc'    => __( 'Default thank-you screen title when no per-form title is set.', 'flowforms' ),
		'default' => __( 'Thank you!', 'flowforms' ),
	],

	'form-loading' => [
		'type'    => 'text',
		'label'   => __( 'Loading Text', 'flowforms' ),
		'desc'    => __( 'Shown while the form is being fetched.', 'flowforms' ),
		'default' => __( 'Loading form…', 'flowforms' ),
	],

	'form-redirecting-in' => [
		'type'    => 'text',
		'label'   => __( 'Redirect Countdown', 'flowforms' ),
		'desc'    => __( 'Countdown shown on the thank-you screen before a redirect. Use {seconds} as a placeholder.', 'flowforms' ),
		'default' => __( 'Redirecting in {seconds}…', 'flowforms' ),
	],

	'form-redirecting' => [
		'type'    => 'text',
		'label'   => __( 'Redirecting Text', 'flowforms' ),
		'desc'    => __( 'Shown when the redirect countdown reaches zero.', 'flowforms' ),
		'default' => __( 'Redirecting…', 'flowforms' ),
	],

	'input-text-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Text / Long Text Placeholder', 'flowforms' ),
		'desc'    => __( 'Default placeholder for short text and long text fields when no per-field placeholder is set.', 'flowforms' ),
		'default' => __( 'Your answer here…', 'flowforms' ),
	],

	'input-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Email Placeholder', 'flowforms' ),
		'desc'    => __( 'Default placeholder for email fields when no per-field placeholder is set.', 'flowforms' ),
		'default' => __( 'name@example.com', 'flowforms' ),
	],

	'input-confirm-email-label' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Label', 'flowforms' ),
		'desc'    => __( 'Label shown above the second email input in confirm-email mode.', 'flowforms' ),
		'default' => __( 'Confirm email', 'flowforms' ),
	],

	'input-confirm-email-placeholder' => [
		'type'    => 'text',
		'label'   => __( 'Confirm Email Placeholder', 'flowforms' ),
		'desc'    => __( 'Placeholder for the confirmation email input.', 'flowforms' ),
		'default' => __( 'Confirm your email', 'flowforms' ),
	],

	'input-other-label' => [
		'type'    => 'text',
		'label'   => __( '"Other" Option Label', 'flowforms' ),
		'desc'    => __( 'Label for the "Other" option in multiple choice and checkbox questions.', 'flowforms' ),
		'default' => __( 'Other', 'flowforms' ),
	],

	'input-other-placeholder' => [
		'type'    => 'text',
		'label'   => __( '"Other" Input Placeholder', 'flowforms' ),
		'desc'    => __( 'Placeholder inside the inline text input that appears when "Other" is selected.', 'flowforms' ),
		'default' => __( 'Type your answer…', 'flowforms' ),
	],

	'input-other-confirm' => [
		'type'    => 'text',
		'label'   => __( '"Other" Confirm Button Label', 'flowforms' ),
		'desc'    => __( 'Accessible label for the tick button that confirms the "Other" free-text answer.', 'flowforms' ),
		'default' => __( 'Confirm', 'flowforms' ),
	],

	'input-rating-label' => [
		'type'    => 'text',
		'label'   => __( 'Rating Button Aria Label', 'flowforms' ),
		'desc'    => __( 'Accessible label for each star button. Use {value} for the star number and {max} for the total.', 'flowforms' ),
		'default' => __( 'Rate {value} out of {max}', 'flowforms' ),
	],

	'input-yes-label' => [
		'type'    => 'text',
		'label'   => __( 'Yes Button (fallback)', 'flowforms' ),
		'desc'    => __( 'Default label for the Yes button when no per-form label is set.', 'flowforms' ),
		'default' => __( 'Yes', 'flowforms' ),
	],

	'input-no-label' => [
		'type'    => 'text',
		'label'   => __( 'No Button (fallback)', 'flowforms' ),
		'desc'    => __( 'Default label for the No button when no per-form label is set.', 'flowforms' ),
		'default' => __( 'No', 'flowforms' ),
	],

	'form-share-label' => [
		'type'    => 'text',
		'label'   => __( 'Share This Form Label', 'flowforms' ),
		'desc'    => __( 'Heading shown above the social share buttons on the thank-you screen.', 'flowforms' ),
		'default' => __( 'Share this form', 'flowforms' ),
	],

	'form-share-on' => [
		'type'    => 'text',
		'label'   => __( 'Share On Aria Label', 'flowforms' ),
		'desc'    => __( 'Accessible label for social share buttons. Use {network} as a placeholder for the network name.', 'flowforms' ),
		'default' => __( 'Share on {network}', 'flowforms' ),
	],

	'form-share-title' => [
		'type'    => 'text',
		'label'   => __( 'Share Title Fallback', 'flowforms' ),
		'desc'    => __( 'Default text used as the share title when the thank-you screen has no title set.', 'flowforms' ),
		'default' => __( 'Check this out!', 'flowforms' ),
	],

	// Section 2: Error and Validation Messages

	'error-validation-heading' => [
		'type'  => 'heading',
		'label' => __( 'Error and Validation Messages', 'flowforms' ),
		'desc'  => __( 'Messages shown when form input fails validation or a submission cannot be completed.', 'flowforms' ),
	],

	'validation-required' => [
		'type'    => 'text',
		'label'   => __( 'Required Field', 'flowforms' ),
		'desc'    => __( 'Shown when a required question is left blank.', 'flowforms' ),
		'default' => __( 'This field is required.', 'flowforms' ),
	],

	'validation-email' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Email', 'flowforms' ),
		'desc'    => __( 'Shown when an email address fails format validation.', 'flowforms' ),
		'default' => __( 'Please enter a valid email address.', 'flowforms' ),
	],

	'validation-email-mismatch' => [
		'type'    => 'text',
		'label'   => __( 'Email Mismatch', 'flowforms' ),
		'desc'    => __( 'Shown when the confirmation email does not match the first email field.', 'flowforms' ),
		'default' => __( 'Email addresses do not match.', 'flowforms' ),
	],

	'validation-number' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Number', 'flowforms' ),
		'desc'    => __( 'Shown when a number field contains non-numeric input.', 'flowforms' ),
		'default' => __( 'Please enter a valid number.', 'flowforms' ),
	],

	'validation-number-min' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Small', 'flowforms' ),
		'desc'    => __( 'Shown when a number is below the minimum. Use {min} as a placeholder for the minimum value.', 'flowforms' ),
		'default' => __( 'Value must be at least {min}.', 'flowforms' ),
	],

	'validation-number-max' => [
		'type'    => 'text',
		'label'   => __( 'Number Too Large', 'flowforms' ),
		'desc'    => __( 'Shown when a number exceeds the maximum. Use {max} as a placeholder for the maximum value.', 'flowforms' ),
		'default' => __( 'Value must be at most {max}.', 'flowforms' ),
	],

	'validation-maxlength' => [
		'type'    => 'text',
		'label'   => __( 'Max Length Exceeded', 'flowforms' ),
		'desc'    => __( 'Shown when text exceeds the character limit. Use {limit} as a placeholder for the limit.', 'flowforms' ),
		'default' => __( 'Please enter no more than {limit} characters.', 'flowforms' ),
	],

	'validation-rating' => [
		'type'    => 'text',
		'label'   => __( 'Invalid Rating', 'flowforms' ),
		'desc'    => __( 'Shown when a rating field has an out-of-range or missing value.', 'flowforms' ),
		'default' => __( 'Please select a valid rating.', 'flowforms' ),
	],

	'validation-selection' => [
		'type'    => 'text',
		'label'   => __( 'No Selection Made', 'flowforms' ),
		'desc'    => __( 'Shown when a multiple choice or checkbox question has no option selected.', 'flowforms' ),
		'default' => __( 'Please make a selection.', 'flowforms' ),
	],

	'validation-checkboxes-min' => [
		'type'    => 'text',
		'label'   => __( 'Too Few Selections', 'flowforms' ),
		'desc'    => __( 'Shown when fewer than the minimum number of checkboxes are selected. Use {count} as a placeholder for the minimum.', 'flowforms' ),
		'default' => __( 'Please select at least {count} options.', 'flowforms' ),
	],

	'validation-checkboxes-max' => [
		'type'    => 'text',
		'label'   => __( 'Too Many Selections', 'flowforms' ),
		'desc'    => __( 'Shown when more than the maximum number of checkboxes are selected. Use {count} as a placeholder for the maximum.', 'flowforms' ),
		'default' => __( 'Please select at most {count} options.', 'flowforms' ),
	],

	'validation-yesno' => [
		'type'    => 'text',
		'label'   => __( 'Yes / No Not Answered', 'flowforms' ),
		'desc'    => __( 'Shown when a yes/no question has no answer selected.', 'flowforms' ),
		'default' => __( 'Please select yes or no.', 'flowforms' ),
	],

	'form-submission-failed' => [
		'type'    => 'text',
		'label'   => __( 'Submission Failed Heading', 'flowforms' ),
		'desc'    => __( 'Heading shown on the error screen when a submission fails.', 'flowforms' ),
		'default' => __( 'Submission failed', 'flowforms' ),
	],

	'form-error-message' => [
		'type'    => 'text',
		'label'   => __( 'Generic Error Message', 'flowforms' ),
		'desc'    => __( 'Shown when a submission fails due to a server or network error.', 'flowforms' ),
		'default' => __( 'Something went wrong. Please try again.', 'flowforms' ),
	],

	'form-spam-message' => [
		'type'    => 'text',
		'label'   => __( 'Spam Detection Message', 'flowforms' ),
		'desc'    => __( 'Shown when a submission is rejected by the honeypot or token checks.', 'flowforms' ),
		'default' => __( 'Your submission could not be processed. Please reload the page and try again.', 'flowforms' ),
	],

	'form-load-error' => [
		'type'    => 'text',
		'label'   => __( 'Form Load Error', 'flowforms' ),
		'desc'    => __( 'Shown when the form cannot be fetched from the server.', 'flowforms' ),
		'default' => __( 'Sorry, this form could not be loaded. Please try again later.', 'flowforms' ),
	],

];
