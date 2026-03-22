import { useState, useMemo } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Alert from "../components/ui/alert";

const CATEGORY_LABELS = {
  contact: "Contact",
  feedback: "Feedback",
  "lead-gen": "Lead Gen",
  survey: "Survey",
  general: "General",
};

export default function Setup({ className }) {
  const templates = formflowData.templates ?? [];

  const [formName, setFormName] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [error, setError] = useState(null);

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
        throw new Error(data.message || "Something went wrong.");
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
        throw new Error(data.message || "Something went wrong.");
      window.location.href = `${formflowData.builderUrl}&form_id=${data.post_id}`;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setLoadingSlug(null);
    }
  };

  return (
    <div
      className={`overflow-y-auto px-4 py-4 sm:py-20 bg-gray-100 ${className}`}
    >
      <div className="bg-white rounded-xl max-w-5xl mx-auto px-4 py-6 sm:p-8">
        <div className="mb-6 pb-6 border-b border-gray-200 sm:flex sm:items-center sm:gap-2">
          <label
            htmlFor="form-name"
            className="block text-xl tracking-tight font-semibold text-gray-900 mb-2 sm:mb-0 sm:min-w-48 sm:shrink-0"
          >
            Name your form
          </label>
          <input
            id="form-name"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter your form name here..."
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 sm:grow"
          />
        </div>

        <div className="mb-6 pb-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Select a template
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Start from a template or build from scratch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
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
              label="All"
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
            No templates match <strong>"{search}"</strong>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BlankCard
              name="Blank form"
              description="Start from scratch with an empty form"
              loading={loadingSlug === "blank"}
              disabled={loading}
              onUse={createBlank}
            />
            {filtered.map((template) => (
              <TemplateCard
                key={template.slug}
                name={template.name}
                description={template.description}
                category={
                  CATEGORY_LABELS[template.category] ?? template.category
                }
                loading={loadingSlug === template.slug}
                disabled={loading}
                onUse={() => useTemplate(template.slug)}
              />
            ))}
          </div>
        )}

        {error && <Alert className="mt-6" type="error" message={error} />}
      </div>
    </div>
  );
}

function CategoryTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}

function BlankCard({ name, description, loading, disabled, onUse }) {
  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <div className="h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100">
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
          className="w-full rounded-lg bg-gray-900 text-white text-sm font-medium py-2 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            "Start from scratch"
          )}
        </button>
      </div>
    </div>
  );
}

function TemplateCard({
  name,
  description,
  category,
  loading,
  disabled,
  onUse,
}) {
  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col overflow-hidden">
      <div className="h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100">
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
          className="cursor-pointer w-full rounded-lg bg-gray-900 text-white text-sm font-medium py-2 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating…
            </>
          ) : (
            "Use template"
          )}
        </button>
        <button className="cursor-pointer w-full rounded-lg bg-white text-gray-900 ring-1 ring-inset ring-gray-300 text-sm font-medium py-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <EyeIcon width={20} height={20} />
          <span>Preview</span>
        </button>
      </div>
    </div>
  );
}

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
