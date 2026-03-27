import { useState } from "react";
import { __ } from '@wordpress/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import THEMES from "./themes";

// ── Color swatch strip preview ────────────────────────────────────────────────

const PREVIEW_KEYS = [
  "bg_color",
  "button_color",
  "title_color",
  "star_color",
  "description_color",
];

function ThemeCard({ theme, onApply }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onApply(theme)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative w-full text-left rounded-xl border-2 border-transparent overflow-hidden transition-all duration-150 hover:border-gray-900 hover:shadow-md focus:outline-none focus:border-gray-900"
    >
      {/* Mini form preview */}
      <div
        className="w-full h-28 flex flex-col justify-center items-center gap-2 px-3"
        style={{ backgroundColor: theme.bg_color }}
      >
        {/* Simulated title line */}
        <div
          className="h-2.5 rounded-full w-3/5"
          style={{ backgroundColor: theme.title_color, opacity: 0.85 }}
        />
        {/* Simulated description line */}
        <div
          className="h-1.5 rounded-full w-2/5"
          style={{ backgroundColor: theme.description_color, opacity: 0.6 }}
        />
        {/* Simulated button */}
        <div
          className="mt-1 h-5 rounded-md w-14 flex items-center justify-center"
          style={{ backgroundColor: theme.button_color }}
        >
          <div
            className="h-1.5 rounded-full w-6"
            style={{ backgroundColor: theme.button_text_color, opacity: 0.8 }}
          />
        </div>
      </div>

      {/* Color swatch strip */}
      <div className="flex h-4">
        {PREVIEW_KEYS.map((key) => (
          <div
            key={key}
            className="flex-1"
            style={{ backgroundColor: theme[key] }}
          />
        ))}
      </div>

      {/* Theme name footer */}
      <div
        className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between"
      >
        <span className="text-xs font-medium text-gray-800 truncate">
          {theme.name}
        </span>
        <span
          className={[
            "text-xs font-semibold text-gray-900 transition-opacity duration-100",
            hovered ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          {__( 'Apply →', 'wpflowforms' )}
        </span>
      </div>
    </button>
  );
}

// ── Main ThemeGallery component ───────────────────────────────────────────────

export default function ThemeGallery({ open, onOpenChange, onApply }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden"
        showCloseButton={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {__( 'Theme Gallery', 'wpflowforms' )}
            </DialogTitle>
            <DialogDescription>
              {__( 'Pick a theme to instantly apply its colour palette to your form. You can fine-tune individual colours afterwards.', 'wpflowforms' )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto max-h-[70vh] p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onApply={(t) => {
                  onApply(t);
                  onOpenChange(false);
                }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}