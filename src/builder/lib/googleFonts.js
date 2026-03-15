// ── Google Fonts ──────────────────────────────────────────────────────────────
// Shared font list and DOM loader used by both the DesignField picker and the
// Canvas preview. Add fonts here to make them available everywhere at once.

export const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Raleway", "Nunito", "Playfair Display", "Merriweather", "Source Sans 3",
  "PT Sans", "Noto Sans", "Ubuntu", "Oswald", "Mukta", "Work Sans",
  "Fira Sans", "DM Sans", "Rubik", "Quicksand", "Josefin Sans",
  "Cabin", "Libre Baskerville", "EB Garamond", "Crimson Text",
  "Cormorant Garamond", "Lora", "Bitter", "Arvo", "Zilla Slab",
  "Cardo", "Spectral", "Alegreya", "Roboto Slab", "Roboto Mono",
  "Source Code Pro", "Space Grotesk", "Space Mono", "Inconsolata",
  "DM Serif Display", "Sora", "Plus Jakarta Sans", "Figtree",
  "Outfit", "Bricolage Grotesque", "Geist",
];

// Inject a Google Fonts <link> tag into the document <head>.
// Deduplicates by font name — safe to call multiple times with the same font.
export function loadGoogleFont(fontName) {
  if (!fontName) return;
  const id = `gf-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}