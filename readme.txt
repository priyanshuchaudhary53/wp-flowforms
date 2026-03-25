=== WP FlowForms ===
Contributors: priyanshuchaudhary
Tags: forms, contact form, conversational form, typeform, form builder
Requires at least: 5.9
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-3.0-only
License URI: https://opensource.org/licenses/GPL-3.0

A Typeform-style conversational form builder for WordPress. Beautiful step-by-step forms, self-hosted, no monthly fees.

== Description ==

WP FlowForms brings the conversational form experience to WordPress — one question at a time, with smooth animations and a clean UI that keeps respondents engaged.

Unlike traditional form plugins that show every field at once, WP FlowForms guides users through your form step by step — just like Typeform — but with all responses stored directly in your WordPress database. No third-party services. No monthly SaaS fees.

**Key Features:**

* **Conversational, step-by-step forms** — one question at a time for higher completion rates
* **Drag-and-drop builder** — intuitive React-based form editor inside your WordPress admin
* **Gutenberg block** — embed forms directly in the block editor
* **Shortcode support** — `[flowform id="123"]` works anywhere
* **Full-page form URLs** — dedicated landing pages for your forms
* **Welcome & Thank You screens** — customisable start and end screens
* **Built-in entries manager** — view, star, trash, and export responses in wp-admin
* **Email notifications** — notify your team when a form is submitted, with smart tag support
* **Anti-spam protection** — honeypot, token verification, and optional Akismet integration
* **Design customisation** — adjust colours, fonts, and layout to match your brand
* **Free starter templates** — contact form, lead generation, customer feedback, testimonial

**Form Field Types:**

* Short text
* Long text (paragraph)
* Email
* Number
* Multiple choice
* Dropdown
* Date

**Smart Tags:**

Use dynamic values anywhere in your email notifications:

`{form_name}` `{admin_email}` `{site_name}` `{all_fields}` `{field:uuid}` `{entry_id}` `{date}`

**Privacy & Data Ownership:**

All form submissions are stored in your own WordPress database. Nothing is sent to external servers (except optionally to Akismet for spam checking, if you have it installed).

== Installation ==

1. Upload the `wp-flowforms` folder to `/wp-content/plugins/`
2. Activate the plugin through the **Plugins** menu in WordPress
3. Go to **FlowForms** in the admin sidebar to create your first form
4. Embed using the Gutenberg block, shortcode `[flowform id="123"]`, or share the full-page URL

== Frequently Asked Questions ==

= Is this a Typeform replacement? =

Yes — for WordPress users. WP FlowForms gives you the same conversational, one-question-at-a-time experience as Typeform, but self-hosted inside your WordPress site with no monthly fee.

= Where are form submissions stored? =

All entries are stored in your WordPress database in the `wp_flowforms_entries` table. Nothing is sent to external servers.

= Does it work with the block editor (Gutenberg)? =

Yes. WP FlowForms includes a native Gutenberg block. You can also use the `[flowform id="123"]` shortcode in classic editor or anywhere shortcodes are supported.

= Does it work with page builders? =

Any page builder that supports shortcodes will work with the `[flowform id="123"]` shortcode.

= Is Akismet required for anti-spam? =

No. Akismet is optional. WP FlowForms includes honeypot and token-based spam protection out of the box. Akismet adds an extra layer if you have it installed and configured.

= Can I customise the form design? =

Yes. The form builder includes a Design panel where you can adjust colours, fonts, button styles, and layout to match your brand.

= What happens if I trash a form? =

Trashed forms display a notice to admins on the frontend, and an empty string to visitors. You can restore a form from the All Forms page.

= What is the draft/publish workflow? =

Changes you make in the builder are auto-saved to a draft. Your live form is only updated when you click **Publish**. This lets you safely edit a live form without affecting visitors until you are ready.

== Screenshots ==

1. The drag-and-drop form builder
2. A conversational form as seen by respondents
3. The entries manager — view and manage all submissions
4. Form design customisation panel
5. Email notification settings with smart tag support

== Changelog ==

= 1.0.0 =
* Initial release
* Drag-and-drop conversational form builder
* Gutenberg block and shortcode embed
* Entries manager with star, trash, and spam support
* Email notifications with smart tags
* Welcome and Thank You screens
* Free starter templates: Contact Form, Lead Generation, Customer Feedback, Testimonial
* Three-layer anti-spam: honeypot, token verification, Akismet integration
* Design customisation panel
* Draft/publish workflow
* Full-page form URLs

== Upgrade Notice ==

= 1.0.0 =
Initial release.
