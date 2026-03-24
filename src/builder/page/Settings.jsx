import { useEffect } from "react";
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
          {/* Spinning circle */}
          <svg
            className="animate-spin h-3 w-3 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Saving…
        </>
      ) : (
        <>
          {/* Error X */}
          <svg
            className="h-3 w-3 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
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

  // Alert user if they try to navigate away while settings are saving
  useEffect(() => {
    if (settingsSaveStatus !== "saving") return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      // Modern browsers show their own message; setting returnValue triggers the dialog
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
          {/* Save status banner sits just inside the content column */}
          <div className="absolute top-6 right-6">
            <SaveStatusBadge status={settingsSaveStatus} />
          </div>

          {activeTab === "general" && <GeneralTab />}
          {activeTab === "email" && <EmailTab />}
        </div>
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
    <section className="">
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

function EmailTab() {
  return (
    <section className="">
      <div className="pt-10 px-10 pb-6 border-b">
        <h2 className="text-base font-semibold text-foreground">
          Email Notifications
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure automated emails sent when a form is submitted.
        </p>
      </div>

      <div className="py-10 px-10 divide-y divide-border">
        <div className="py-4 first:pt-0 last:pb-0">
          <div className="rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Email notification settings coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({ label, description, checked, onChange }) {
  const id = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
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
