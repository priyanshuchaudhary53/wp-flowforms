# FlowForms

A conversational, step-by-step form builder for WordPress. Create Typeform-style forms without a monthly subscription.

![FlowForms in action](https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExenh1NmFjYTY2dWJkaHl3cTVjZWtnOGZuZzN3d2lzYXJwN2ZuMGlzeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/u4HBzehKnJsgYba0Sd/giphy.gif)

## Features

- **Conversational forms** — one question at a time, full-screen experience
- **Drag-and-drop builder** — React-based admin builder with live preview
- **Question types** — Short text, Long text, Email, Number, Multiple choice, Checkboxes, Rating, Yes/No
- **Welcome & Thank You screens** — with background image support
- **Design controls** — themes, colors, fonts, background images
- **Email notifications** — with smart tags (`{all_fields}`, `{form_name}`, `{entry_id}`, etc.)
- **Entries dashboard** — view, star, filter, and manage submissions
- **Gutenberg block** — embed forms in the block editor
- **Shortcode** — `[flowform id="123"]`
- **Templates** — Contact Form, Lead Generation, Customer Feedback, Testimonial
- **Draft / Publish workflow** — save drafts without affecting the live form
- **Anti-spam** — honeypot, rotating token, and Akismet integration
- **Full-page embed** — `/flowform/{id}` URL, no theme required

## Requirements

- WordPress 6.0+
- PHP 7.4+

## Installation

1. Download the latest ZIP from the [releases page](https://github.com/priyanshuchaudhary53/wp-flowforms/releases)
2. In WordPress admin go to **Plugins → Add New → Upload Plugin**
3. Activate the plugin

Or install directly from the [WordPress Plugin Directory](https://wordpress.org/plugins/flowforms/)

## Development

```bash
npm install
npm run build      # Production build
npm run start      # Dev build with file watching
```

Compiled assets go to `build/`. PHP enqueues files from there — always rebuild after changes to `src/`.

## License

GPL-3.0-only — see [LICENSE](https://opensource.org/licenses/GPL-3.0)
