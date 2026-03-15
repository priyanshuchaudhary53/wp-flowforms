/**
 * Built-in form themes.
 *
 * Each theme provides values for every color key in designSettings.js:
 *   bg_color, title_color, description_color, answer_color,
 *   button_color, button_hover_color, button_text_color,
 *   hint_color, star_color
 *
 */

const THEMES = [
  // ── 1. Clean Light ────────────────────────────────────────────────────────
  {
    id: "clean_light",
    name: "Clean Light",
    bg_color: "#ffffff",
    title_color: "#111827",
    description_color: "#6b7280",
    answer_color: "#111827",
    button_color: "#111827",
    button_hover_color: "#374151",
    button_text_color: "#ffffff",
    hint_color: "#9ca3af",
    star_color: "#f59e0b",
  },

  // ── 2. Midnight ───────────────────────────────────────────────────────────
  {
    id: "midnight",
    name: "Midnight",
    bg_color: "#0f172a",
    title_color: "#f1f5f9",
    description_color: "#94a3b8",
    answer_color: "#e2e8f0",
    button_color: "#6366f1",
    button_hover_color: "#4f46e5",
    button_text_color: "#ffffff",
    hint_color: "#64748b",
    star_color: "#fbbf24",
  },

  // ── 3. Tropical Sunset ────────────────────────────────────────────────────
  {
    id: "tropical_sunset",
    name: "Tropical Sunset",
    bg_color: "#fff7ed",
    title_color: "#7c2d12",
    description_color: "#c2410c",
    answer_color: "#9a3412",
    button_color: "#ea580c",
    button_hover_color: "#c2410c",
    button_text_color: "#ffffff",
    hint_color: "#fb923c",
    star_color: "#f97316",
  },

  // ── 4. Ocean Breeze ───────────────────────────────────────────────────────
  {
    id: "ocean_breeze",
    name: "Ocean Breeze",
    bg_color: "#f0f9ff",
    title_color: "#0c4a6e",
    description_color: "#0369a1",
    answer_color: "#075985",
    button_color: "#0284c7",
    button_hover_color: "#0369a1",
    button_text_color: "#ffffff",
    hint_color: "#7dd3fc",
    star_color: "#0ea5e9",
  },

  // ── 5. Forest ─────────────────────────────────────────────────────────────
  {
    id: "forest",
    name: "Forest",
    bg_color: "#f0fdf4",
    title_color: "#14532d",
    description_color: "#15803d",
    answer_color: "#166534",
    button_color: "#16a34a",
    button_hover_color: "#15803d",
    button_text_color: "#ffffff",
    hint_color: "#86efac",
    star_color: "#22c55e",
  },

  // ── 6. Slate Pro ──────────────────────────────────────────────────────────
  {
    id: "slate_pro",
    name: "Slate Pro",
    bg_color: "#f8fafc",
    title_color: "#0f172a",
    description_color: "#475569",
    answer_color: "#1e293b",
    button_color: "#334155",
    button_hover_color: "#1e293b",
    button_text_color: "#f1f5f9",
    hint_color: "#94a3b8",
    star_color: "#f59e0b",
  },

  // ── 7. Rose Garden ────────────────────────────────────────────────────────
  {
    id: "rose_garden",
    name: "Rose Garden",
    bg_color: "#fff1f2",
    title_color: "#881337",
    description_color: "#be123c",
    answer_color: "#9f1239",
    button_color: "#e11d48",
    button_hover_color: "#be123c",
    button_text_color: "#ffffff",
    hint_color: "#fda4af",
    star_color: "#fb7185",
  },

  // ── 8. Lavender Mist ─────────────────────────────────────────────────────
  {
    id: "lavender_mist",
    name: "Lavender Mist",
    bg_color: "#faf5ff",
    title_color: "#3b0764",
    description_color: "#7e22ce",
    answer_color: "#581c87",
    button_color: "#9333ea",
    button_hover_color: "#7e22ce",
    button_text_color: "#ffffff",
    hint_color: "#d8b4fe",
    star_color: "#a855f7",
  },

  // ── 9. Carbon ─────────────────────────────────────────────────────────────
  {
    id: "carbon",
    name: "Carbon",
    bg_color: "#18181b",
    title_color: "#fafafa",
    description_color: "#a1a1aa",
    answer_color: "#e4e4e7",
    button_color: "#3f3f46",
    button_hover_color: "#52525b",
    button_text_color: "#ffffff",
    hint_color: "#71717a",
    star_color: "#facc15",
  },

  // ── 10. Peach Cream ───────────────────────────────────────────────────────
  {
    id: "peach_cream",
    name: "Peach Cream",
    bg_color: "#fef3c7",
    title_color: "#78350f",
    description_color: "#92400e",
    answer_color: "#7c2d12",
    button_color: "#d97706",
    button_hover_color: "#b45309",
    button_text_color: "#ffffff",
    hint_color: "#fcd34d",
    star_color: "#f59e0b",
  },

  // ── 11. Arctic ────────────────────────────────────────────────────────────
  {
    id: "arctic",
    name: "Arctic",
    bg_color: "#ecfeff",
    title_color: "#164e63",
    description_color: "#0e7490",
    answer_color: "#155e75",
    button_color: "#06b6d4",
    button_hover_color: "#0891b2",
    button_text_color: "#ffffff",
    hint_color: "#a5f3fc",
    star_color: "#22d3ee",
  },

  // ── 12. Espresso ──────────────────────────────────────────────────────────
  {
    id: "espresso",
    name: "Espresso",
    bg_color: "#faf8f5",
    title_color: "#292524",
    description_color: "#78716c",
    answer_color: "#44403c",
    button_color: "#44403c",
    button_hover_color: "#292524",
    button_text_color: "#faf8f5",
    hint_color: "#a8a29e",
    star_color: "#d97706",
  },

  // ── 13. Neon Night ────────────────────────────────────────────────────────
  {
    id: "neon_night",
    name: "Neon Night",
    bg_color: "#09090b",
    title_color: "#ffffff",
    description_color: "#a1a1aa",
    answer_color: "#e4e4e7",
    button_color: "#22d3ee",
    button_hover_color: "#06b6d4",
    button_text_color: "#09090b",
    hint_color: "#52525b",
    star_color: "#22d3ee",
  },

  // ── 14. Sage & Linen ─────────────────────────────────────────────────────
  {
    id: "sage_linen",
    name: "Sage & Linen",
    bg_color: "#f5f5f0",
    title_color: "#2d3b2d",
    description_color: "#5a6e5a",
    answer_color: "#3a4f3a",
    button_color: "#5a6e5a",
    button_hover_color: "#3a4f3a",
    button_text_color: "#f5f5f0",
    hint_color: "#a3b8a3",
    star_color: "#84a284",
  },

  // ── 15. Cobalt ────────────────────────────────────────────────────────────
  {
    id: "cobalt",
    name: "Cobalt",
    bg_color: "#eff6ff",
    title_color: "#1e3a8a",
    description_color: "#1d4ed8",
    answer_color: "#1e40af",
    button_color: "#2563eb",
    button_hover_color: "#1d4ed8",
    button_text_color: "#ffffff",
    hint_color: "#93c5fd",
    star_color: "#3b82f6",
  },

  // ── 16. Ember ─────────────────────────────────────────────────────────────
  {
    id: "ember",
    name: "Ember",
    bg_color: "#1c0a00",
    title_color: "#fef9c3",
    description_color: "#fde68a",
    answer_color: "#fef08a",
    button_color: "#dc2626",
    button_hover_color: "#b91c1c",
    button_text_color: "#ffffff",
    hint_color: "#92400e",
    star_color: "#f97316",
  },

  // ── 17. Cotton Candy ──────────────────────────────────────────────────────
  {
    id: "cotton_candy",
    name: "Cotton Candy",
    bg_color: "#fdf2f8",
    title_color: "#701a75",
    description_color: "#a21caf",
    answer_color: "#86198f",
    button_color: "#d946ef",
    button_hover_color: "#c026d3",
    button_text_color: "#ffffff",
    hint_color: "#f0abfc",
    star_color: "#e879f9",
  },

  // ── 18. Dusk ──────────────────────────────────────────────────────────────
  {
    id: "dusk",
    name: "Dusk",
    bg_color: "#1e1b2e",
    title_color: "#e0d7ff",
    description_color: "#a78bfa",
    answer_color: "#c4b5fd",
    button_color: "#7c3aed",
    button_hover_color: "#6d28d9",
    button_text_color: "#ffffff",
    hint_color: "#4c1d95",
    star_color: "#c084fc",
  },

  // ── 19. Sand Dune ─────────────────────────────────────────────────────────
  {
    id: "sand_dune",
    name: "Sand Dune",
    bg_color: "#fefce8",
    title_color: "#713f12",
    description_color: "#854d0e",
    answer_color: "#7c2d12",
    button_color: "#ca8a04",
    button_hover_color: "#a16207",
    button_text_color: "#ffffff",
    hint_color: "#fde047",
    star_color: "#eab308",
  },

  // ── 20. Glacier ───────────────────────────────────────────────────────────
  {
    id: "glacier",
    name: "Glacier",
    bg_color: "#f0fdf4",
    title_color: "#1e3a2f",
    description_color: "#2d6a4f",
    answer_color: "#1b4332",
    button_color: "#2d6a4f",
    button_hover_color: "#1b4332",
    button_text_color: "#d8f3dc",
    hint_color: "#95d5b2",
    star_color: "#52b788",
  },
];

export default THEMES;
