// ── Shared label + hint wrapper ───────────────────────────────────────────

import { Sketch } from "@uiw/react-color";
import { useEffect, useRef, useState } from "react";

function FieldWrapper({ label, hint, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block select-none text-sm/6 text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-gray-400 leading-snug">{hint}</p>
      )}
    </div>
  );
}

// ── Color ─────────────────────────────────────────────────────────────────
// Native colour swatch + synced hex text input so users can type exact values.

function ColorField({ field, value, onChange }) {
  const id = useRef(`color-field-${Math.random().toString(36).slice(2)}`);
  const hex = value ?? field.default ?? "#000000";
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    // Use capture so it fires before Radix's outside-click handler
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  return (
    <div className="flex justify-between items-start">
      <label htmlFor={id.current} className="text-sm/6 text-gray-700">
        {field.label}
      </label>
      <div ref={containerRef} className="w-36 relative">
        {/* Text input + swatch trigger */}
        <div className="relative flex items-center">
          {/* Swatch button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="absolute right-0 top-0 bottom-0 pointer-events-none aspect-square rounded-r-md focus:outline-none ring-1 ring-inset ring-gray-900/20"
            style={{
              backgroundColor: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000",
            }}
          />
          <input
            id={id.current}
            type="text"
            value={hex}
            maxLength={7}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            onFocus={() => setOpen(true)}
            className="cursor-pointer w-full rounded-md border-0 bg-white pr-11.5 pl-2.5 py-1.5 text-sm/6 text-gray-900 ring-1 ring-inset ring-gray-900/20 placeholder:text-gray-400 hover:bg-gray-50 focus-visible:outline-none"
          />
        </div>

        {/* Picker popover */}
        {open && (
          // stopPropagation prevents Radix Sheet from seeing this as an outside click
          <div
            className="absolute z-50 mt-1 right-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Sketch
              color={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"}
              onChange={(c) => onChange(c.hex)}
              disableAlpha
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────

function SelectField({ field, value, onChange }) {
  const id = useRef(`select-field-${Math.random().toString(36).slice(2)}`);
  const currentValue = value ?? field.default ?? "";

  return (
    <FieldWrapper label={field.label} hint={field.hint} htmlFor={id.current}>
      <select
        id={id.current}
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="hidden"
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        role="group"
        aria-labelledby={id.current}
        className="flex flex-wrap gap-2 mt-2"
      >
        {field.options?.map((opt) => {
          const isSelected = opt.value === currentValue;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(opt.value)}
              className={[
                Icon ? "p-2.5" : "py-2 px-4",
                "rounded-md text-sm transition-colors duration-150 cursor-pointer",
                isSelected
                  ? "bg-gray-95 bg-cyan-100 text-cyan-700"
                  : "bg-white ring-1 ring-inset ring-gray-900/20 hover:bg-gray-50 text-gray-800",
              ].join(" ")}
            >
              {Icon && <Icon size={16} className="w-4 h-4" />}
              <span className={`${Icon ? "sr-only" : ""}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </FieldWrapper>
  );
}

// ── Text ──────────────────────────────────────────────────────────────────

function TextField({ field, value, onChange }) {
  const id = useRef(`text-field-${Math.random().toString(36).slice(2)}`);

  return (
    <FieldWrapper label={field.label} hint={field.hint} htmlFor={id.current}>
      <input
        id={id.current}
        type="text"
        value={value ?? field.default ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.default || ""}
        className="mt-2 w-full rounded-md border-0 bg-white px-3.5 py-2 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
      />
    </FieldWrapper>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────

function ToggleField({ field, value, onChange }) {
  const checked = value ?? field.default ?? false;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="select-none text-base/7 font-medium text-gray-900">
          {field.label}
        </p>
        {field.hint && (
          <p className="text-xs text-gray-400 leading-snug">{field.hint}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
          checked ? "bg-gray-900" : "bg-gray-300",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ── Google Font ───────────────────────────────────────────────────────────
// Popular Google Fonts list with searchable combobox dropdown.

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Merriweather",
  "Source Sans 3",
  "PT Sans",
  "Noto Sans",
  "Ubuntu",
  "Oswald",
  "Mukta",
  "Work Sans",
  "Fira Sans",
  "DM Sans",
  "Rubik",
  "Quicksand",
  "Josefin Sans",
  "Cabin",
  "Libre Baskerville",
  "EB Garamond",
  "Crimson Text",
  "Cormorant Garamond",
  "Lora",
  "Bitter",
  "Arvo",
  "Zilla Slab",
  "Cardo",
  "Spectral",
  "Alegreya",
  "Roboto Slab",
  "Roboto Mono",
  "Source Code Pro",
  "Space Grotesk",
  "Space Mono",
  "Inconsolata",
  "DM Serif Display",
  "Sora",
  "Plus Jakarta Sans",
  "Figtree",
  "Outfit",
  "Bricolage Grotesque",
  "Geist",
];

// Inject a Google Fonts <link> tag into the document head (deduplicated).
function loadGoogleFont(fontName) {
  if (!fontName) return;
  const id = `gf-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fontName,
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function GoogleFontField({ field, value, onChange }) {
  const id = useRef(`gf-field-${Math.random().toString(36).slice(2)}`);
  const currentFont = value ?? field.default ?? "";
  const [query, setQuery] = useState(currentFont);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Keep query in sync when value changes externally
  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  // Load font when it changes
  useEffect(() => {
    if (currentFont) loadGoogleFont(currentFont);
  }, [currentFont]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // Reset query to the actual selected value on blur
        setQuery(currentFont);
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open, currentFont]);

  const filtered = query.trim()
    ? GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(query.toLowerCase()))
    : GOOGLE_FONTS;

  const handleSelect = (font) => {
    loadGoogleFont(font);
    onChange(font);
    setQuery(font);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
  };

  return (
    <FieldWrapper label={field.label} hint={field.hint} htmlFor={id.current}>
      <div ref={containerRef} className="relative mt-2">
        {/* Input */}
        <div className="relative">
          <input
            id={id.current}
            type="text"
            value={query}
            placeholder="Default (system font)"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            style={
              currentFont ? { fontFamily: `"${currentFont}", sans-serif` } : {}
            }
            className="w-full rounded-md border-0 bg-white pr-8 pl-3.5 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
          />
          {/* Clear button */}
          {currentFont && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear font"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <div
            className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg ring-1 ring-black/10 overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ul className="max-h-52 overflow-y-auto py-1 text-sm">
              {filtered.map((font) => {
                // Eagerly load fonts visible in list so previews render
                loadGoogleFont(font);
                return (
                  <li
                    key={font}
                    onPointerDown={() => handleSelect(font)}
                    className={[
                      "px-3 py-2 cursor-pointer flex items-center justify-between gap-2",
                      font === currentFont
                        ? "bg-cyan-100 text-cyan-700"
                        : "text-gray-800 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span style={{ fontFamily: `"${font}", sans-serif` }}>
                      {font}
                    </span>
                    <span
                      className="text-xs text-gray-400 shrink-0"
                      style={{ fontFamily: `"${font}", sans-serif` }}
                    >
                      Aa
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function DesignField({ field, value, onChange }) {
  const props = { field, value, onChange };
  switch (field.type) {
    case "color":
      return <ColorField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "toggle":
      return <ToggleField {...props} />;
    case "google_font":
      return <GoogleFontField {...props} />;
    default:
      return <TextField {...props} />;
  }
}
