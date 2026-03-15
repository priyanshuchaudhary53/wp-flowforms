// ── Font scale ────────────────────────────────────────────────────────────────
// Each scale defines four semantic roles: title, subtitle, body, and hint.
// Add new roles here as the canvas grows — they'll automatically appear as
// CSS variables (--fs-title, --fs-subtitle, --fs-body, --fs-hint) on the
// canvas root and can be referenced anywhere inside it.
//
// Pixel values map roughly to Tailwind's type scale:
//   hint     → xs   (12px)
//   body     → sm   (14px)
//   subtitle → xl   (20px)
//   title    → 3xl  (30px) / 4xl (36px) / 5xl (44px)

export const FONT_SCALE = {
  small: {
    title:    "1.875rem", // 30px  (Tailwind text-3xl)
    subtitle: "1.25rem",  // 20px  (text-xl)
    body:     "0.875rem", // 14px  (text-sm)
    hint:     "0.75rem",  // 12px  (text-xs)
  },
  regular: {
    title:    "2.25rem",  // 36px  (text-4xl)
    subtitle: "1.5rem",   // 24px  (text-2xl)
    body:     "1rem",     // 16px  (text-base)
    hint:     "0.875rem", // 14px  (text-sm)
  },
  large: {
    title:    "2.75rem",  // 44px  (text-5xl)
    subtitle: "1.75rem",  // 28px  (text-2xl+)
    body:     "1.125rem", // 18px  (text-lg)
    hint:     "1rem",     // 16px  (text-base)
  },
};

// Resolve a scale object from a font_size design key, falling back to regular.
export function getFontScale(fontSizeKey) {
  return FONT_SCALE[fontSizeKey] ?? FONT_SCALE.regular;
}