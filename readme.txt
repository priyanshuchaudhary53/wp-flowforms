=== FlowForms – Conversational Form Builder for WordPress ===
Contributors: priyanshuchaudhary
Tags: contact form, conversational form, typeform, form builder, survey
Requires at least: 6.2
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-3.0-only
License URI: https://opensource.org/licenses/GPL-3.0

The Typeform alternative for WordPress. Build beautiful, conversational step-by-step forms, surveys & quizzes — self-hosted, free, no monthly fees.

== Description ==

**FlowForms is the easiest way to build Typeform-style conversational forms in WordPress — without the SaaS price tag.**

Most contact form plugins give you a wall of fields. FlowForms gives your visitors a *conversation*. One question at a time, guided and focused — the result is higher completion rates, better responses, and a user experience that feels modern and intentional.

Whether you're collecting leads, running surveys, gathering testimonials, or building customer feedback forms, FlowForms delivers a premium, interactive form experience that lives on *your* server, under *your* control, with no monthly subscription required.

**Why FlowForms?**
Typeform costs $25–$83/month. FlowForms is self-hosted and free. Same conversational UX — your WordPress site, your data.

[View Demo](https://www.wpflowforms.com/demo) | [Templates](https://www.wpflowforms.com/templates)

= Conversational, Step-by-Step Forms =

FlowForms presents one question at a time, just like Typeform. This reduces overwhelm, keeps respondents focused, and significantly improves form completion rates compared to traditional multi-field forms.

Every form flows through three stages:

* **Welcome Screen** — customisable title, description, start button, and background image
* **Questions** — any combination of 8 field types, drag-to-reorder
* **Thank You Screen** — closing message with optional redirect URL, delay, and social share buttons

= Drag & Drop Form Builder =

Build any form in minutes without touching a line of code. The intuitive React-powered drag-and-drop builder lets you add, reorder, and configure questions visually. What you build is exactly what your visitors see.

= 8 Ready-to-Use Field Types =

FlowForms ships with all the essentials:

* **Short Text** — single-line text input
* **Long Text** — multi-line paragraph / textarea
* **Multiple Choice** — single-select with optional "Other" answer
* **Checkboxes** — multi-select with min/max limits and optional "Other" answer
* **Rating** — star rating with configurable max stars and shape
* **Yes / No** — two-button question with customisable labels
* **Email** — with format validation and optional confirm-email mode
* **Number** — numeric input with optional min/max validation

= Beautiful Design Customisation =
 
Every form is independently styled with a live design panel. Customise:
 
* Background colour
* Title, description, answer, hint, field, and button colours
* Button hover colour and text
* Star rating colour
* Layout alignment: left or centered
* Border radius: angular, rounded, or full
* Google Fonts
* Font size: small, regular, or large
 
Forms look great on every device — FlowForms is fully responsive and mobile-ready.

= Flexible Embed Options =
 
Embed your forms anywhere in WordPress using your preferred method:
 
* **Shortcode:** `[flowform id="123"]`
* **Gutenberg Block:** native `FlowForm` block — drag it straight into the editor
* **Full-Page URL:** `/flowform/{id}` — share a direct link to a distraction-free form page

= Pre-Built Form Templates =
 
Get started in seconds with 4 ready-to-use templates:
 
* Contact Form
* Lead Generation Survey
* Customer Feedback
* Testimonial Form

= Submission Management =
 
Every submission is stored securely in your WordPress database. The built-in entries dashboard gives you full control:
 
* Paginated list with search and sorting
* Individual entry detail view
* Bulk actions: mark read/unread, star, trash, delete permanently
* Status filters: All, Starred, Spam, Trash
* Unread count badge in the admin menu

= Email Notifications =
 
Get notified the moment someone submits your form. Configure the recipient, subject, sender name, reply-to address, and message body — all with smart tag support.
 
**Available smart tags:** `{admin_email}`, `{site_name}`, `{form_name}`, `{all_fields}`

= Built-In Spam Protection =
 
Three layers of anti-spam run automatically on every submission — no CAPTCHA plugins required:
 
1. **Honeypot field** — invisible to humans, catches bots
2. **Rotating server-side token** — tied to each form, refreshed daily
3. **Akismet integration** — if Akismet is active, submissions are checked automatically; spam entries are flagged and saved for review

= Multilingual Ready =
 
Every user-facing string — button labels, validation messages, placeholders, error messages — is customisable from the Global Settings panel. No translation plugin needed to adapt FlowForms for any language.

= FlowForms Pro (Coming Soon) =
 
We are actively researching the features WordPress users most want to pay for. The Pro version will be a self-hosted annual licence — significantly cheaper than Typeform or Jotform — and will extend the free plugin without replacing it.
 
Candidate Pro features under research:
 
* Conditional logic (show/hide questions based on answers)
* Multiple email notifications and respondent confirmation emails
* Email marketing integrations (Mailchimp, ConvertKit, ActiveCampaign, and more)
* File upload field
* Stripe payment field
* CSV / Excel entry export
* Opinion scale / NPS field
* Date & time picker field
* Phone number field with country code
* GDPR consent checkbox field
* Form scheduling (open/close at a specific date)
* Submission limits (cap responses at a set number)
* Zapier / webhook integrations
* Calculator & quiz scoring
* Extended pro template library
 
Want to influence what we build first? [Request a feature](https://www.wpflowforms.com/roadmap) and tell us which feature matters most to you.

= Why Self-Hosted Beats SaaS for Forms =
 
* **Monthly cost:** Free (vs $25–$83/mo for Typeform, $34–$99/mo for Jotform)
* **Your own server:** Yes — all data stays in your WordPress database
* **Your own data:** Yes — no third-party servers, no vendor lock-in
* **WordPress-native:** Yes — Gutenberg block, shortcode, full-page URL
* **Conversational UX:** Yes — one question at a time, just like Typeform

= Full Feature List =
 
* Drag-and-drop conversational form builder
* 8 field types: short text, long text, multiple choice, checkboxes, rating, yes/no, email, number
* Welcome screen and thank you screen for every form
* Redirect on completion with configurable delay
* Social share buttons on thank you screen
* Live design customisation — colours, fonts, layout, border radius
* Google Font supported
* Layout alignments: left and center
* Progress bar (show/hide)
* Navigation arrows (show/hide)
* Gutenberg block embed
* Shortcode embed
* Full-page form URL
* 4 free starter templates
* Submission entries database with full admin management
* Read/unread, star, trash, spam entry statuses
* Unread count badge in WordPress admin menu
* Email notifications with smart tags
* Honeypot, token, and Akismet spam protection
* Customisable user-facing strings
* GDPR-friendly — all data stored on your own server
* 100% mobile responsive
* Developer hooks for extensibility

== Installation ==

1. Upload the `flowforms` folder to `/wp-content/plugins/`, or install directly via the WordPress plugin screen.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Go to **FlowForms → Add New** to create your first form.
4. Embed the form using the Gutenberg block, the shortcode `[flowform id="YOUR_ID"]`, or share the full-page URL.

== Frequently Asked Questions ==

= How is this different from Contact Form 7 or WPForms? =
 
Traditional form plugins display all fields at once on a single page. FlowForms shows one question at a time in a guided, conversational flow — similar to Typeform. This typically increases completion rates and produces more thoughtful responses.

= Is this a Typeform alternative for WordPress? =
 
Yes. FlowForms is built specifically to bring the Typeform-style conversational form experience to self-hosted WordPress — without a monthly SaaS subscription.

= Where are form submissions stored? =

All submissions are stored in your own WordPress database. No data is sent to external servers.

= Does it work with the block editor (Gutenberg)? =

Yes. FlowForms includes a native Gutenberg block. You can also use the `[flowform id="123"]` shortcode in classic editor or anywhere shortcodes are supported.

= Does it work with page builders? =

Any page builder that supports shortcodes will work with the `[flowform id="123"]` shortcode.

= Does it work with Akismet? =
 
Yes. If Akismet is active on your site, FlowForms automatically checks submissions and flags spam entries in your dashboard.

= Can I customise the form design? =

Yes. The form builder includes a Design panel where you can adjust colours, fonts, button styles, and layout to match your brand.

= Can I translate the form interface into another language? =
 
Yes. Every user-facing string is customisable from **FlowForms → Global Settings → Messages** — no translation plugin required.

= What happens if I trash a form? =

Trashed forms display a notice to admins on the frontend, and an empty string to visitors. You can restore a form from the All Forms page.

= What is the draft/publish workflow? =

Changes you make in the builder are auto-saved to a draft. Your live form is only updated when you click **Publish**. This lets you safely edit a live form without affecting visitors until you are ready.

= Is there a Pro version? =
 
A Pro version is in active research. [Join the waitlist](https://www.wpflowforms.com/#pro-waitlist) to be notified at launch and help us decide which features to build first.

== Screenshots ==

1. The drag-and-drop form builder
2. A conversational form as seen by respondents
3. The entries manager — view and manage all submissions
4. Form design customisation panel
5. Email notification settings with smart tag support

== Source Code ==

The full source code, including all JavaScript source files and build configuration, is publicly available on [GitHub](https://github.com/priyanshuchaudhary53/wp-flowforms)

== Changelog ==

= 1.0.0 =
* Initial release
* Drag-and-drop conversational form builder
* Gutenberg block and shortcode embed
* Entries manager with star, trash, and spam support
* Email notifications with smart tags
* Welcome and Thank You screens
* Free starter templates: Contact Form, Lead Generation, Customer Feedback, Testimonial
* Three-layer anti-spam with Akismet integration
* Design customisation panel
* Draft/publish workflow
* Full-page form URLs

== Upgrade Notice ==

= 1.0.0 =
Initial release.
