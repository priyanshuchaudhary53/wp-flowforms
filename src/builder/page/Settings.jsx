import { useState, useRef, useEffect, useCallback } from "react";
import { useFormStore } from "../store/useFormStore";

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "general", label: "General" },
  { id: "email", label: "Email Notifications" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getActiveTab() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  return TABS.some((t) => t.id === tab) ? tab : "general";
}

function tabUrl(tabId) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tabId);
  return url.toString();
}

// Site metadata from PHP.
const SITE = formflowData.site ?? {};

// ── Smart Tags ────────────────────────────────────────────────────────────────

const SMART_TAGS = [
  { tag: "{admin_email}", label: "Admin Email",  description: SITE.adminEmail ?? "The site administrator's email" },
  { tag: "{site_name}",   label: "Site Name",    description: SITE.siteName   ?? "The name of your website" },
  { tag: "{form_name}",   label: "Form Name",    description: "The name of this form" },
  { tag: "{all_fields}",  label: "All Fields",   description: "All submitted field values" },
];

// Inject chip styles once at module level (not per-component, avoids flicker)
let _chipStylesInjected = false;
function ensureChipStyles() {
  if (_chipStylesInjected) return;
  _chipStylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .ff-smart-tag {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      background: #efedfd;
      color: #493eba;
      border: 1px solid #dedcfa;
      border-radius: 4px;
      padding: 0 5px;
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.65;
      white-space: nowrap;
      cursor: default;
      user-select: none;
      vertical-align: middle;
    }
    .ff-smart-tag-remove {
      display: inline-flex;
      align-items: center;
      background: none;
      border: none;
      color: #493eba;
      cursor: pointer;
      padding: 0 0 0 2px;
      font-size: 13px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.12s;
    }
    .ff-smart-tag:hover .ff-smart-tag-remove {
      opacity: 1;
    }
    .ff-smart-tag-remove:hover {
      color: #e11d48;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Convert a raw value string (e.g. "Hello {form_name}!") to innerHTML
 * for the contenteditable editor, turning known tags into chip spans.
 */
function rawToEditorHtml(raw, tags) {
  if (!raw) return "";
  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return raw
    .split(/(\{[^}]+\})/g)
    .map((part) => {
      const tagDef = tags.find((t) => t.tag === part);
      if (!tagDef) return escape(part);
      return `<span class="ff-smart-tag" data-tag="${part}" contenteditable="false">${tagDef.label}<button class="ff-smart-tag-remove" type="button" tabindex="-1">×</button></span>`;
    })
    .join("");
}

/**
 * Walk the contenteditable DOM and produce the raw tag string.
 * Text nodes → their text; chip spans → their data-tag attribute.
 */
function editorToRaw(el) {
  let raw = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      raw += node.textContent;
    } else if (node.dataset?.tag) {
      raw += node.dataset.tag;
    } else {
      raw += node.textContent;
    }
  });
  return raw;
}

// ── SmartTagInput component ───────────────────────────────────────────────────

/**
 * A contenteditable input that lets users type free text and insert smart tags
 * by typing @. Selected tags are displayed as highlighted chips with a hover
 * remove (×) button.
 */
function SmartTagInput({ value, placeholder, onChange, tags }) {
  const editorRef = useRef(null);
  // Track the last value we wrote to the DOM so we can skip unnecessary re-renders
  const lastSetValue = useRef(value);
  const atPosRef = useRef(null); // { node, atOffset, caretOffset }

  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Ensure chip CSS is present
  useEffect(() => { ensureChipStyles(); }, []);

  // Set initial HTML on mount & wire up the remove-button click delegation
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = rawToEditorHtml(value, tags);

    const handleClick = (e) => {
      if (!e.target.classList.contains("ff-smart-tag-remove")) return;
      e.preventDefault();
      const chip = e.target.closest(".ff-smart-tag");
      if (!chip) return;
      chip.remove();
      const newVal = editorToRaw(editorRef.current);
      lastSetValue.current = newVal;
      onChange(newVal);
    };

    editorRef.current.addEventListener("click", handleClick);
    return () => editorRef.current?.removeEventListener("click", handleClick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. form reset) without resetting cursor
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastSetValue.current) return;
    lastSetValue.current = value;
    editorRef.current.innerHTML = rawToEditorHtml(value, tags);
  }, [value, tags]);

  // Detect if cursor is inside an @… sequence and show/position the dropdown
  const checkAtPattern = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { setShowDropdown(false); return; }

    const range = sel.getRangeAt(0);
    const node = range.startContainer;

    if (node.nodeType !== Node.TEXT_NODE || !editorRef.current?.contains(node)) {
      setShowDropdown(false);
      return;
    }

    const textBefore = node.textContent.slice(0, range.startOffset);
    const atIdx = textBefore.lastIndexOf("@");

    if (atIdx === -1) { setShowDropdown(false); return; }

    atPosRef.current = { node, atOffset: atIdx, caretOffset: range.startOffset };
    setFilter(textBefore.slice(atIdx + 1).toLowerCase());
    setShowDropdown(true);

    // Position the dropdown below the @ character
    try {
      const atRange = document.createRange();
      atRange.setStart(node, atIdx);
      atRange.collapse(true);
      const rect = atRange.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      setDropdownStyle({
        top:  rect.bottom - editorRect.top + 4,
        left: Math.max(0, rect.left - editorRect.left),
      });
    } catch (_) { /* ignore */ }
  }, []);

  const handleInput = useCallback(() => {
    const newVal = editorToRaw(editorRef.current);
    lastSetValue.current = newVal;
    onChange(newVal);
    checkAtPattern();
  }, [onChange, checkAtPattern]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") setShowDropdown(false);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay so onMouseDown in the dropdown fires before blur hides it
    setTimeout(() => setShowDropdown(false), 150);
  }, []);

  const insertTag = useCallback(
    (tagDef) => {
      if (!atPosRef.current || !editorRef.current) return;
      const { node, atOffset, caretOffset } = atPosRef.current;

      // Delete the @…filter text
      const delRange = document.createRange();
      delRange.setStart(node, atOffset);
      delRange.setEnd(node, caretOffset);
      delRange.deleteContents();

      // Build the chip
      const chip = document.createElement("span");
      chip.className = "ff-smart-tag";
      chip.dataset.tag = tagDef.tag;
      chip.setAttribute("contenteditable", "false");
      chip.innerHTML = `${tagDef.label}<button class="ff-smart-tag-remove" type="button" tabindex="-1">×</button>`;

      delRange.insertNode(chip);

      // Place an empty text node after the chip so the cursor has somewhere to land
      let afterNode = chip.nextSibling;
      if (!afterNode || afterNode.nodeType !== Node.TEXT_NODE) {
        afterNode = document.createTextNode("");
        chip.after(afterNode);
      }

      // Move cursor right after the chip
      const newRange = document.createRange();
      newRange.setStart(afterNode, 0);
      newRange.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(newRange);

      setShowDropdown(false);
      atPosRef.current = null;

      const newVal = editorToRaw(editorRef.current);
      lastSetValue.current = newVal;
      onChange(newVal);
      editorRef.current.focus();
    },
    [onChange]
  );

  const filteredTags = tags.filter(
    (t) =>
      !filter ||
      t.label.toLowerCase().includes(filter) ||
      t.tag.toLowerCase().includes(filter)
  );

  return (
    <div className="relative">
      {/* Contenteditable editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        className={[
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 min-h-[38px] leading-relaxed",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
          "empty:before:pointer-events-none",
        ].join(" ")}
      />

      {/* @ dropdown */}
      {showDropdown && filteredTags.length > 0 && (
        <div
          className="absolute z-50 bg-white border border-border rounded-lg shadow-lg py-1 min-w-52 max-h-56 overflow-y-auto"
          style={dropdownStyle}
        >
          {filteredTags.map((tagDef) => (
            <button
              key={tagDef.tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertTag(tagDef); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-ff-primary-50 flex items-center justify-between gap-3"
            >
              <span className="font-medium text-foreground">{tagDef.label}</span>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{tagDef.tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hint text */}
      <p className="mt-1.5 text-xs text-muted-foreground">
        Start typing{" "}
        <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px] border border-border">
          @
        </kbd>{" "}
        to see all available smart tags
      </p>
    </div>
  );
}

// ── Save status indicator ─────────────────────────────────────────────────────

function SaveStatusBadge({ status }) {
  if (status === "saved") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all",
        status === "saving"
          ? "bg-ff-primary-50 text-ff-primary-600"
          : "bg-red-50 text-red-600",
      ].join(" ")}
    >
      {status === "saving" ? (
        <>
          <svg className="animate-spin h-3 w-3 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving…
        </>
      ) : (
        <>
          <svg className="h-3 w-3 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
          Save failed
        </>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function Settings({ className }) {
  const activeTab = getActiveTab();
  const settingsSaveStatus = useFormStore((s) => s.settingsSaveStatus);

  useEffect(() => {
    if (settingsSaveStatus !== "saving") return;
    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [settingsSaveStatus]);

  return (
    <div className={`overflow-y-auto px-3 py-10 bg-ff-background ${className}`}>
      <div className="mx-auto flex bg-white rounded-2xl max-w-4xl">
        {/* Tab bar */}
        <div className="shrink-0 min-w-64 flex flex-col gap-1 border-r border-border py-10 pl-6">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={tabUrl(tab.id)}
              className={[
                "inline-block px-4 py-2 text-sm font-medium border-r-2 -mr-px transition-colors",
                activeTab === tab.id
                  ? "border-ff-primary-500 text-ff-primary-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              ].join(" ")}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Tab content */}
        <div className="relative grow">
          <div className="absolute top-6 right-6">
            <SaveStatusBadge status={settingsSaveStatus} />
          </div>

          {activeTab === "general" && <GeneralTab />}
          {activeTab === "email"   && <EmailTab />}
        </div>
      </div>
    </div>
  );
}

// ── General tab ───────────────────────────────────────────────────────────────

const GENERAL_DEFAULTS = {
  progress_bar:      true,
  navigation_arrows: true,
  powered_by:        false,
};

const GENERAL_FIELDS = [
  {
    key: "progress_bar",
    type: "toggle",
    label: "Progress bar",
    description: "Show a progress indicator at the top of the form so respondents know how far along they are.",
  },
  {
    key: "navigation_arrows",
    type: "toggle",
    label: "Navigation arrows",
    description: "Display previous and next arrow buttons to let respondents move between questions freely.",
  },
  {
    key: "powered_by",
    type: "toggle",
    label: 'Show "Powered by WP FlowForms"',
    description: "Loved WP FlowForms? Spread the word to others about this awesome plugin by showing a small badge at the bottom of your form.",
  },
];

function GeneralTab() {
  const form          = useFormStore((s) => s.form);
  const updateSetting = useFormStore((s) => s.updateSetting);

  const formSettings = form?.settings?.general ?? {};
  const values       = { ...GENERAL_DEFAULTS, ...formSettings };

  return (
    <section>
      <div className="px-10 pt-10 pb-6 border-b">
        <h2 className="text-base font-semibold text-foreground">General</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Control how your form looks and behaves for respondents.
        </p>
      </div>

      <div className="py-10 px-10 divide-y divide-border">
        {GENERAL_FIELDS.map((field) => (
          <ToggleRow
            key={field.key}
            label={field.label}
            description={field.description}
            checked={values[field.key]}
            onChange={(val) => updateSetting("general", field.key, val)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Email tab ─────────────────────────────────────────────────────────────────

// Default values for the first (and only, in free) notification item.
const NOTIF_DEFAULTS = {
  name:           "Admin Notification",
  email:          "{admin_email}",
  subject:        "New submission: {form_name}",
  sender_name:    "{site_name}",
  sender_address: "{admin_email}",
  replyto:        "",
  message:        "{all_fields}",
};

// Sentinel used in the <select> to represent the custom-email option.
const CUSTOM_EMAIL_SENTINEL = "__custom__";

function EmailTab() {
  const form          = useFormStore((s) => s.form);
  const updateSetting = useFormStore((s) => s.updateSetting);

  const emailSettings = form?.settings?.email ?? {};
  const enabled       = emailSettings.enabled  ?? true;

  // Read first notification item, merged with defaults.
  const savedNotif = emailSettings.notifications?.["1"] ?? {};
  const notif      = { ...NOTIF_DEFAULTS, ...savedNotif };

  /**
   * Update a field on notification item "1".
   * Writes the full notifications object back to avoid overwriting other items.
   */
  const updateNotif = (key, value) => {
    const current        = emailSettings.notifications ?? {};
    const updatedNotif   = { ...NOTIF_DEFAULTS, ...(current["1"] ?? {}), [key]: value };
    const updatedNotifs  = { ...current, "1": updatedNotif };
    updateSetting("email", "notifications", updatedNotifs);
  };

  return (
    <section>
      <div className="pt-10 px-10 pb-6 border-b">
        <h2 className="text-base font-semibold text-foreground">Email Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure automated emails sent when a form is submitted.
        </p>
      </div>

      <div className="py-10 px-10 divide-y divide-border">

        {/* ── Enable toggle ── */}
        <ToggleRow
          label="Enable email notifications"
          description="Send an email notification whenever a new form submission is received."
          checked={enabled}
          onChange={(val) => updateSetting("email", "enabled", val)}
        />

        {/* ── Notification fields — only shown when enabled ── */}
        {enabled && (
          <>
            {/* Send to */}
            <EmailRecipientRow
              label="Send to"
              description="Who receives this notification email."
              value={notif.email}
              onChange={(val) => updateNotif("email", val)}
            />

            {/* Subject */}
            <InputRow
              label="Subject"
              description="The subject line of the notification email."
              value={notif.subject}
              placeholder="New submission: {form_name}"
              onChange={(val) => updateNotif("subject", val)}
              smartTags={SMART_TAGS}
            />

            {/* From name */}
            <InputRow
              label="From name"
              description="The sender name shown in the recipient's email client."
              value={notif.sender_name}
              placeholder="{site_name}"
              onChange={(val) => updateNotif("sender_name", val)}
              smartTags={SMART_TAGS}
            />

            {/* From email */}
            <SelectRow
              label="From email"
              description="The sender address shown in the recipient's email client."
              options={[{
                value: "{admin_email}",
                label: `Admin email${SITE.adminEmail ? ` (${SITE.adminEmail})` : ""}`,
              }]}
              value={notif.sender_address}
              onChange={(val) => updateNotif("sender_address", val)}
            />

            {/* Reply-To */}
            <InputRow
              label="Reply-To"
              description="When the recipient replies, their email client will address it here. Leave empty to use the From email."
              value={notif.replyto}
              placeholder="Leave empty to use From email"
              onChange={(val) => updateNotif("replyto", val)}
              smartTags={SMART_TAGS}
            />
          </>
        )}

      </div>
    </section>
  );
}

// ── Shared field components ───────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer select-none">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-ff-primary-500" : "bg-input",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
            "ring-0 transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

/**
 * A text input row.
 * Pass `smartTags` to enable the @ mention smart tag picker.
 * Without `smartTags`, shows a plain input with an optional `resolvedHint`.
 */
function InputRow({ label, description, value, placeholder, resolvedHint, onChange, smartTags }) {
  const showHint = !smartTags && resolvedHint && resolvedHint !== value;

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1 mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {smartTags ? (
        <SmartTagInput
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          tags={smartTags}
        />
      ) : (
        <>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          {showHint && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Resolves to:</span> {resolvedHint}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * "Send to" row — dropdown with a built-in Admin email option (showing the
 * real address in the label) plus a "Custom email address…" option that
 * reveals an inline text input.
 *
 * Stored value: "{admin_email}" for the admin option, or a raw email string
 * for custom addresses. PHP resolves "{admin_email}" via smart tags at send time.
 */
function EmailRecipientRow({ label, description, value, onChange }) {
  const isCustom = value !== "{admin_email}" && value !== "";
  const [showCustom, setShowCustom] = useState(isCustom);
  const [customEmail, setCustomEmail] = useState(isCustom ? value : "");

  // When the form data loads asynchronously from the API, `value` changes after
  // the initial render. Re-sync local state so the saved custom email is restored.
  useEffect(() => {
    const custom = value !== "{admin_email}" && value !== "";
    setShowCustom(custom);
    if (custom) setCustomEmail(value);
  }, [value]);

  const adminLabel = `Admin email${SITE.adminEmail ? ` (${SITE.adminEmail})` : ""}`;
  const selectValue = showCustom ? CUSTOM_EMAIL_SENTINEL : "{admin_email}";

  const handleSelectChange = (e) => {
    if (e.target.value === CUSTOM_EMAIL_SENTINEL) {
      setShowCustom(true);
      // Don't call onChange yet — wait for the user to type
    } else {
      setShowCustom(false);
      setCustomEmail("");
      onChange("{admin_email}");
    }
  };

  const handleCustomChange = (e) => {
    const email = e.target.value;
    setCustomEmail(email);
    onChange(email);
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1 mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <select
          value={selectValue}
          onChange={handleSelectChange}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="{admin_email}">{adminLabel}</option>
          <option value={CUSTOM_EMAIL_SENTINEL}>Custom email address…</option>
        </select>

        {showCustom && (
          <input
            type="email"
            value={customEmail}
            placeholder="Enter email address"
            onChange={handleCustomChange}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        )}
      </div>
    </div>
  );
}

/**
 * A generic select dropdown row.
 */
function SelectRow({ label, description, options, value, onChange }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-1 mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
