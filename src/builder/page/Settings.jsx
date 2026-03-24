import { useEffect, useCallback } from "react";
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

// ── Root component ────────────────────────────────────────────────────────────

export default function Settings({ className }) {
  const activeTab = getActiveTab();

  return (
    <div className={`overflow-y-auto bg-ff-background ${className}`}>
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border mb-8">
          {TABS.map((tab) => (
            <a
              key={tab.id}
              href={tabUrl(tab.id)}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
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
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "email" && <EmailTab />}
      </div>
    </div>
  );
}

// ── General tab ───────────────────────────────────────────────────────────────

const GENERAL_DEFAULTS = {
  progress_bar: true,
  navigation_arrows: true,
  powered_by: false,
};

const GENERAL_FIELDS = [
  {
    key: "progress_bar",
    label: "Progress bar",
    description:
      "Show a progress indicator at the top of the form so respondents know how far along they are.",
  },
  {
    key: "navigation_arrows",
    label: "Navigation arrows",
    description:
      "Display previous and next arrow buttons to let respondents move between questions freely.",
  },
  {
    key: "powered_by",
    label: 'Show "Powered by WP FlowForms"',
    description:
      "Loved WP FlowForms? Spread the word to others about this awesome plugin by showing a small badge at the bottom of your form.",
  },
];

function GeneralTab() {
  const form = useFormStore((s) => s.form);
  const updateSetting = useFormStore((s) => s.updateSetting);

  // Merge stored values with defaults so new keys are always defined.
  const formSettings = form?.settings?.general ?? {};
  const values = { ...GENERAL_DEFAULTS, ...formSettings };

  return (
    <section className="space-y-2">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">General</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Control how your form looks and behaves for respondents.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background divide-y divide-border">
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

function EmailTab() {
  return (
    <section className="space-y-4">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground">
          Email Notifications
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure automated emails sent when a form is submitted.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Email notification settings coming soon.
        </p>
      </div>
    </section>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-start justify-between gap-6 px-4 py-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Toggle switch */}
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
