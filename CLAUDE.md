# WP FlowForms — CLAUDE.md

A conversational step-by-step form builder for WordPress. Typeform-style forms with a React builder, a vanilla JS renderer, and a Gutenberg block.

---

## Commands

```bash
npm run build        # Production build (all three bundles)
npm run start        # Development build with file watching
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
```

After any change to `src/` you must rebuild — PHP enqueues the compiled files in `build/`.

---

## Architecture overview

### PHP layer (`includes/`)

**Entry point:** `wp-flowforms.php` → `includes/WP_FlowForms.php`

`WP_FlowForms` is a singleton container. All shared objects are registered in `objects()` on `plugins_loaded` and retrieved via `wp_flowforms()->obj('key')`:

| Key | Class | Role |
|---|---|---|
| `form` | `FlowForms_Form_Handler` | CPT registration + CRUD for `wpff_forms` posts |
| `entry` | `FlowForms_Entry_Handler` | All DB operations on `flowforms_entries` |
| `frontend` | `FlowForms_Frontend` | Shortcode, public renderer assets, preview URLs |
| `templates` | `FlowForms_Templates` | Free template registry |

Admin-only classes are instantiated directly (not in the registry) inside `is_admin()` in `includes()`:
- `FlowForms_Admin_Menu` — registers all WP admin menu pages
- `FlowForms_Builder` — builder page controller (enqueues, output)
- `FlowForms_Forms_Overview` + `FlowForms_Forms_List_Table` — All Forms page
- `FlowForms_Entries_Overview` + `FlowForms_Entries_List_Table` — Entries page

### JavaScript layer (`src/`)

Three independent bundles, each compiled to `build/`:

| Bundle | Source | Description |
|---|---|---|
| `build/builder/` | `src/builder/` | React admin form builder |
| `build/form/` | `src/form/` | Vanilla JS public form renderer |
| `build/block/` | `src/block/` | Gutenberg block editor script |

---

## Form data structure

Forms are stored as a single JSON blob in `wpff_forms` post `post_content`. The top-level structure is:

```json
{
  "content": {
    "published": { ...formContent } | null,
    "draft":     { ...formContent } | null
  },
  "design":   { ...designTokens },
  "settings": { ...formSettings }
}
```

**Content slots:**
- `draft` — what the builder is currently editing. Written by every auto-save.
- `published` — the live version served to visitors. Only updated when the user explicitly clicks Publish.
- A brand-new form has `published: null` and `draft: {content}`.
- After first Publish: `published: {content}`, `draft: null`.

**formContent shape:**
```json
{
  "welcomeScreen":  { "content": {...}, "settings": {...} },
  "thankYouScreen": { "content": {...}, "settings": {...} },
  "questions": [
    {
      "id":       "<uuid>",
      "type":     "short_text",
      "content":  { "title": "", "description": "", "buttonLabel": "OK" },
      "settings": { "required": false, "placeholder": "" }
    }
  ]
}
```

**Question `content.title`** is the field label shown in both the form renderer and the admin entries view. Always use `content.title` — not `content.label` or `content.question`.

**design shape** — see `includes/defaults/form-design.php`.

**settings shape** — see `includes/defaults/form-settings.php`.

---

## REST API

Base namespace: `formflow/v1`. All authenticated routes require `edit_posts`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/forms` | ✓ | List all published forms |
| POST | `/forms` | ✓ | Create blank form |
| GET | `/forms/{id}` | ✓ | Load form for builder (draft-first) |
| PATCH | `/forms/{id}` | ✓ | Auto-save to draft slot |
| PATCH | `/forms/{id}/design` | ✓ | Update design (writes to published + draft) |
| PATCH | `/forms/{id}/settings` | ✓ | Update settings |
| POST | `/forms/{id}/publish` | ✓ | Promote draft → published |
| POST | `/forms/{id}/revert` | ✓ | Discard draft, restore published |
| GET | `/forms/{id}/public` | ✗ | Public renderer endpoint (published only) |
| GET | `/forms/{id}/preview` | ✓ | Builder preview (draft-first) |
| POST | `/forms/{id}/submit` | ✗ | Handle submission, save entry |
| POST | `/forms/from-template` | ✓ | Create form from template slug |
| GET | `/templates/{slug}/preview-url` | ✓ | Get signed template preview URL |

Design and settings are **not versioned** — they go live immediately when saved, without going through the draft/publish cycle.

---

## Database

Table: `{prefix}flowforms_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint | Auto-increment primary key |
| `form_id` | bigint | References `wpff_forms` post ID |
| `answers` | longtext | JSON object keyed by question UUID |
| `ip_address` | varchar(45) | IPv4 or IPv6 |
| `user_agent` | text | |
| `status` | varchar(20) | `active` \| `spam` \| `trash` |
| `is_read` | tinyint(1) | 0 = unread, 1 = read |
| `is_starred` | tinyint(1) | 0 = normal, 1 = starred |
| `created_at` | datetime | UTC, set on insert |

`dbDelta()` manages schema — add columns here and re-activate the plugin to apply.

---

## Admin pages

| URL | Page slug | Controller |
|---|---|---|
| `admin.php?page=wpff_forms` | `wpff_forms` | `FlowForms_Forms_Overview` |
| `admin.php?page=wpff_form_builder` | `wpff_form_builder` | `FlowForms_Builder` |
| `admin.php?page=wpff_entries` | `wpff_entries` | `FlowForms_Entries_Overview` |
| `admin.php?page=wpff_settings` | `wpff_settings` | `FlowForms_Settings` |

`wpff_is_admin_page($slug)` checks `$_REQUEST['page'] === 'wpff_' . $slug` and `is_admin()`. Use it to gate admin-only code.

---

## Builder (React)

**Entry:** `src/builder/index.js` → `src/builder/App.jsx`

**State:** Single Zustand store at `src/builder/store/useFormStore.js`. All builder state lives here — form data, selected block, save status, design draft, etc.

**Key store methods:**
- `fetchForm()` — loads form from REST on mount
- `saveForm()` — debounced auto-save to draft slot (800ms)
- `publishForm()` — promotes draft to published
- `updateSetting(section, key, value)` — updates `form.settings[section][key]`, debounced persist to `/settings` endpoint
- `updateDesign(design)` — updates design, saves via `/design` endpoint

**Pages** (`src/builder/page/`):
- `Setup.jsx` — template picker shown when `formId === 0`
- `Editor.jsx` — main drag-and-drop builder canvas
- `Settings.jsx` — General and Email Notifications tabs
- `Share.jsx` — public URL and embed code

**Data flow through builder:**
1. PHP localises `formflowData` into the page (see `class-builder.php`)
2. `App.jsx` reads `formflowData.formId` — if 0, shows Setup; otherwise fetches form
3. Builder edits go into the Zustand store and auto-save to the `draft` slot
4. Design changes go directly to the `design` key (not versioned)
5. Settings changes go directly to the `settings` key (not versioned)
6. Publish promotes `draft` → `published` and clears `draft`

**`formflowData` object** (available in all builder JS):
```js
formflowData.apiUrl        // REST base URL
formflowData.nonce         // WP nonce for REST requests
formflowData.formId        // Current form ID (0 on setup page)
formflowData.view          // 'setup' | 'builder' | 'settings' | 'share'
formflowData.builderUrl    // Admin URL for the builder page
formflowData.adminFormsUrl // Admin URL for All Forms page
formflowData.previewUrl    // Signed preview URL for current form
formflowData.publicUrl     // Public embed URL for current form
formflowData.templates     // Array of template metadata (no content)
formflowData.site          // { adminEmail, siteName }
```

---

## Public renderer (Vanilla JS)

**Entry:** `src/form/index.js`

Boots one `FormApp` instance per `[data-flowform-id]` container found on the page. Each instance fetches its form data from `/forms/{id}/public` (unauthenticated) and renders the conversational UI.

**`flowformPublicData`** (available in renderer JS):
```js
flowformPublicData.apiUrl          // REST base URL
flowformPublicData.nonce           // WP nonce
flowformPublicData.previewMode     // bool — skips validation
flowformPublicData.formIds         // array of form IDs on this page
flowformPublicData.templatePreview // bool — true for template preview pages
flowformPublicData.templateContent // form content when templatePreview is true
```

**Template preview** (no real form post): when `templatePreview: true`, `index.js` boots `FormApp` directly from `templateContent` instead of fetching from the API.

**Embed methods:**
- **Shortcode:** `[flowform id="123"]` — renders a container div; assets enqueued only on pages with a form
- **Gutenberg block:** `wp-flowforms/form` — server-side rendered via `includes/admin/block/render.php`
- **Full-page URL:** `/flowform/{id}` (pretty permalinks) or `/?flowform_id={id}` — bare HTML page, no theme

---

## Frontend — trashed form handling

When a form's `post_status` is not `publish`:

| Surface | Admin sees | Visitor sees |
|---|---|---|
| Full-page URL | Styled "not available" page (404) | Same |
| Shortcode | Inline amber warning + Restore link | Empty string |
| Block (frontend) | Same amber notice via `render.php` | Empty string |
| Block (editor) | WP `Notice` component warning | — |

`FlowForms_Frontend::trashed_form_notice($form_id)` generates the admin notice HTML. It's called from both `render_shortcode()` and `render.php`.

---

## Templates

**Free templates** live in `templates/*.php` at the plugin root. Each file returns an array:

```php
return [
    'slug'          => 'contact-form',
    'name'          => 'Contact Form',
    'description'   => '...',
    'category'      => 'contact',    // used for filter tabs in Setup.jsx
    'thumbnail_url' => '...',        // optional, shown in template card
    'content'       => [             // full formContent shape
        'welcomeScreen'  => [...],
        'thankYouScreen' => [...],
        'questions'      => [...],
    ],
    'design'        => [...],        // optional design overrides
];
```

`FlowForms_Templates` auto-scans the directory — drop a file in, no registration needed.

**Pro templates** hook in via:
```php
add_filter('wpff_templates', function($templates) {
    $templates['pro-slug'] = require __DIR__ . '/templates/pro-slug.php';
    return $templates;
});
```

Only metadata (no `content`) is passed to JS via `formflowData.templates`. Content is fetched server-side only when "Use template" is clicked — the browser never sees template form JSON directly.

---

## Entries admin

**All Entries:** `admin.php?page=wpff_entries`

- `?view=single&entry_id={id}` opens the single entry detail page
- `?status=trash` shows trash, `?status=spam` shows spam, `?status=starred` shows starred
- **Status is read from the DB entry, not the URL** — never rely on the URL `status` param to determine button state on the single entry page
- AJAX star toggle: `wp_ajax_wpff_toggle_star` — registered in constructor, not gated by page check
- Bulk actions: nonce verified against `bulk-entries` or `wpff_entry_{action}`

**`FlowForms_Entry_Handler`** — all DB operations. Key methods: `get()`, `get_multiple()`, `get_counts()`, `get_adjacent_ids()`, `mark_read()`, `star()`, `update_status()`, `delete()`, `delete_by_status()`.

---

## Email notifications (settings structure)

Stored in `form.settings.email`:

```json
{
  "enabled": true,
  "notifications": {
    "1": {
      "name":           "Admin Notification",
      "email":          "{admin_email}",
      "subject":        "New submission: {form_name}",
      "sender_name":    "{site_name}",
      "sender_address": "{admin_email}",
      "replyto":        "",
      "message":        "{all_fields}"
    }
  }
}
```

- `enabled` is a global kill switch for all notifications on this form
- `notifications` is a keyed object — `"1"` is the stable ID of the first item
- **Free:** only item `"1"` is processed
- **Pro:** will iterate all items
- All values support smart tags. Current tags: `{admin_email}`, `{site_name}`, `{form_name}`, `{all_fields}`, `{field:question_uuid}`, `{entry_id}`, `{date}`
- Smart tags are resolved at send time server-side. The raw tag string is always what gets saved — never the resolved value

---

## Key conventions

**PHP**
- All plugin functions/classes prefixed `wpff_` / `FlowForms_`
- All WordPress hooks prefixed `wpff_`
- `wpff_decode($json)` — safe JSON decode with `wp_unslash`
- `wpff_is_admin_page($slug)` — page check helper
- `wpff_array_insert($array, $insert, $after)` — insert into associative array after a key
- Admin page classes guard in `init()` with `wpff_is_admin_page()` before hooking anything
- AJAX handlers that need to work on `admin-ajax.php` must be registered in the constructor, not in `init()` — the page guard will block them otherwise

**JavaScript**
- Builder state lives exclusively in `useFormStore` — don't maintain local state for anything that needs to persist
- Design and settings save immediately on change (debounced 800ms) — they bypass the draft/publish cycle
- Form content auto-saves to `draft` only — never directly to `published`
- `formflowData` is the PHP→JS bridge in the builder; `flowformPublicData` is the bridge in the renderer

**CSS**
- Builder uses Tailwind v4 with shadcn/ui components
- Brand colour tokens: `--color-brand-primary`, `--color-brand-accent`, etc. in `@theme inline` block in `src/builder/style.css`
- Frontend form styles are in `src/form/style.css` — separate from builder styles, no Tailwind
- After any CSS change to `src/`, rebuild with `npm run build`