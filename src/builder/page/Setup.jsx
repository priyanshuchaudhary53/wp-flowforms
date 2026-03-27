import { useState, useMemo, useEffect, useRef } from "react";
import { __, sprintf } from "@wordpress/i18n";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Alert from "../components/ui/alert";

const CATEGORY_LABELS = {
  contact:  __( "Contact",  "wpflowforms" ),
  feedback: __( "Feedback", "wpflowforms" ),
  "lead-gen": __( "Lead Gen", "wpflowforms" ),
  survey:   __( "Survey",   "wpflowforms" ),
  general:  __( "General",  "wpflowforms" ),
};

export default function Setup({ className }) {
  const templates = formflowData.templates ?? [];

  const [formName, setFormName] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(null);

  const categories = useMemo(() => {
    const cats = [...new Set(templates.map((t) => t.category).filter(Boolean))];
    return cats;
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        activeCategory === "all" || t.category === activeCategory;
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        t.name.toLowerCase().includes(term) ||
        (t.description || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [templates, activeCategory, search]);

  const createBlank = async () => {
    setError(null);
    setLoading(true);
    setLoadingSlug("blank");
    try {
      const res = await fetch(formflowData.apiUrl + "/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": formflowData.nonce,
        },
        body: JSON.stringify({ form_name: formName || "Untitled form" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || __( "Something went wrong.", "wpflowforms" ));
      window.location.href = `${formflowData.builderUrl}&form_id=${data.post_id}`;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setLoadingSlug(null);
    }
  };

  const useTemplate = async (slug) => {
    setError(null);
    setLoading(true);
    setLoadingSlug(slug);
    try {
      const res = await fetch(formflowData.apiUrl + "/forms/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": formflowData.nonce,
        },
        body: JSON.stringify({
          template_slug: slug,
          form_name: formName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || __( "Something went wrong.", "wpflowforms" ));
      window.location.href = `${formflowData.builderUrl}&form_id=${data.post_id}`;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setLoadingSlug(null);
    }
  };

  const openPreview = async (slug) => {
    setPreviewLoading(slug);
    try {
      const res = await fetch(
        `${formflowData.apiUrl}/templates/${slug}/preview-url`,
        {
          headers: { "X-WP-Nonce": formflowData.nonce },
        },
      );
      const data = await res.json();
      if (!res.ok || !data.preview_url)
        throw new Error(data.message || __( "Could not load preview.", "wpflowforms" ));
      setPreviewUrl(data.preview_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(null);
    }
  };

  return (
    <>
      <div
        className={`overflow-y-auto px-4 py-4 sm:py-20 bg-ff-surface ${className}`}
      >
        <div className="bg-white rounded-xl max-w-5xl mx-auto px-4 py-6 sm:p-8">
          <div className="mb-6 pb-6 border-b border-gray-200 sm:flex sm:items-center sm:gap-2">
            <label
              htmlFor="form-name"
              className="block text-xl tracking-tight font-semibold text-gray-900 mb-2 sm:mb-0 sm:min-w-48 sm:shrink-0"
            >
              { __( "Name your form", "wpflowforms" ) }
            </label>
            <input
              id="form-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={ __( "Enter your form name here...", "wpflowforms" ) }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 sm:grow"
            />
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              { __( "Select a template", "wpflowforms" ) }
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              { __( "Start from a template or build from scratch.", "wpflowforms" ) }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-xs">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={ __( "Search templates…", "wpflowforms" ) }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <CategoryTab
                label={ __( "All", "wpflowforms" ) }
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />
              {categories.map((cat) => (
                <CategoryTab
                  key={cat}
                  label={CATEGORY_LABELS[cat] ?? cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                />
              ))}
            </div>
          </div>

          {filtered.length === 0 && search ? (
            <div className="text-center py-16 text-sm text-gray-500">
              { __( "No templates match", "wpflowforms" ) } <strong>"{search}"</strong>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <BlankCard
                name={ __( "Blank form", "wpflowforms" ) }
                description={ __( "Start from scratch with an empty form", "wpflowforms" ) }
                loading={loadingSlug === "blank"}
                disabled={loading}
                onUse={createBlank}
              />
              {filtered.map((template) => (
                <TemplateCard
                  key={template.slug}
                  name={template.name}
                  description={template.description}
                  thumbnailUrl={template.thumbnail_url}
                  category={
                    CATEGORY_LABELS[template.category] ?? template.category
                  }
                  loading={loadingSlug === template.slug}
                  previewLoading={previewLoading === template.slug}
                  disabled={loading || !!previewLoading}
                  onUse={() => useTemplate(template.slug)}
                  onPreview={() => openPreview(template.slug)}
                />
              ))}
            </div>
          )}

          {error && <Alert className="mt-6" type="error" message={error} />}
        </div>
      </div>

      {/* Preview modal — rendered outside the scrollable container */}
      {previewUrl && (
        <TemplatePreviewModal
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}

// ─── Category tab ─────────────────────────────────────────────────────────────

function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-ff-secondary-100 text-ff-secondary-700"
          : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Blank card ───────────────────────────────────────────────────────────────

function BlankCard({ name, description, loading, disabled, onUse }) {
  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <div className="w-full aspect-3/2 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
          <PlusIcon className="w-6 h-6 text-gray-500" />
        </div>
      </div>

      <div className="flex-1 p-4">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onUse}
          disabled={disabled}
          className="cursor-pointer w-full rounded-lg bg-ff-primary-500 text-white text-sm font-medium px-4 py-2 hover:bg-ff-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              { __( "Creating…", "wpflowforms" ) }
            </>
          ) : (
            __( "Start from scratch", "wpflowforms" )
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  name,
  description,
  category,
  thumbnailUrl,
  loading,
  previewLoading,
  disabled,
  onUse,
  onPreview,
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <div className="w-full aspect-3/2 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={ sprintf( /* translators: %s: template name */ __( "%s template screenshot", "wpflowforms" ), name ) }
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <TemplateIcon />
            </div>
            {category && (
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                {category}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-4">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onUse}
          disabled={disabled}
          className="cursor-pointer w-full rounded-lg bg-ff-primary-500 text-white text-sm font-medium px-4 py-2 hover:bg-ff-primary-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ff-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              { __( "Creating…", "wpflowforms" ) }
            </>
          ) : (
            __( "Use template", "wpflowforms" )
          )}
        </button>
        <button
          onClick={onPreview}
          disabled={disabled}
          className="cursor-pointer w-full rounded-lg bg-white text-gray-900 ring-1 ring-inset ring-gray-300 text-sm font-medium px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {previewLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          ) : (
            <>
              <EyeIcon width={16} height={16} className="stroke-2" />
              <span>{ __( "Preview", "wpflowforms" ) }</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Template preview modal ───────────────────────────────────────────────────

const DEVICES = [
  {
    id: "desktop",
    label: __( "Desktop", "wpflowforms" ),
    icon: <ComputerDesktopIcon width={18} height={18} />,
    width: "100%",
    height: "100%",
  },
  {
    id: "mobile",
    label: __( "Mobile", "wpflowforms" ),
    icon: <DevicePhoneMobileIcon width={18} height={18} />,
    width: "390px",
    height: "844px",
  },
];

function TemplatePreviewModal({ url, onClose }) {
  const [device, setDevice] = useState("desktop");
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef(null);

  // Close on Escape.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const active = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const isConstrained = device !== "desktop";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={ __( "Template preview", "wpflowforms" ) }
    >
      {/* Toolbar */}
      <div className="flex-none flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white">
        {/* Device switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              title={d.label}
              className={`w-8 h-8 flex justify-center items-center rounded text-sm transition-colors ${
                device === d.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="sr-only">{d.label}</span>
              {d.icon}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-500 font-medium tracking-wide uppercase">
          { __( "Template Preview", "wpflowforms" ) }
        </span>

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={ __( "Close preview", "wpflowforms" ) }
        >
          <XMarkIcon width={20} height={20} />
        </button>
      </div>

      {/* iframe area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 bg-gray-50">
        <div
          className={`relative transition-all duration-300 ring-1 ring-black/10 rounded-2xl overflow-hidden bg-white ${
            isConstrained ? "" : "w-full h-full"
          }`}
          style={
            isConstrained
              ? {
                  width: active.width,
                  height: active.height,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }
              : {}
          }
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span className="text-sm">{ __( "Loading preview…", "wpflowforms" ) }</span>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={url}
            title={ __( "Template preview", "wpflowforms" ) }
            className="w-full h-full border-0"
            style={{ display: loaded ? "block" : "none" }}
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Template icon fallback ───────────────────────────────────────────────────

function TemplateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
