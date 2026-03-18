/**
 * Resolves which background image, layout, brightness and globalBg to use
 * for a given block's settings combined with the global design.
 *
 * Rules:
 *   - Local wallpaper → local image only; global is completely ignored.
 *   - Local split     → local image shown in the split panel; global image
 *                       rendered as a full-bleed wallpaper behind the split.
 *   - No local image  → fall back to global image as wallpaper.
 */
export function resolveBackground(settings, design) {
  const localImage    = settings?.backgroundImage?.url ?? null;
  const globalImage   = design?.bg_image?.url ?? null;
  const localBgLayout = settings?.bgLayout ?? "wallpaper";
  const bgPosition    = settings?.bgPosition ?? "left";

  // Global wallpaper is active when:
  //   • There is no local image at all, OR
  //   • The local layout is split (global sits behind the entire split block)
  const globalActive =
    !!globalImage && (!localImage || localBgLayout === "split");

  // In split mode the split panel shows only the local image (not global).
  // In wallpaper mode we prefer local, then fall back to global.
  const bgImage =
    localBgLayout === "split"
      ? (localImage || null)
      : localImage || (globalActive ? globalImage : null);

  // bgBrightness: use global value when global is the only image source,
  // otherwise use the per-block brightness.
  const bgBrightness = globalActive && !localImage
    ? (design?.bg_brightness ?? 0)
    : (settings?.bgBrightness ?? 0);

  // globalBrightness is always the design-level value, used separately when
  // the global image is rendered behind a split layout.
  const globalBrightness = design?.bg_brightness ?? 0;

  // Only pass globalBg when split mode + global is active.
  const globalBg =
    localBgLayout === "split" && globalActive ? globalImage : null;

  return {
    bgImage,
    bgLayout: localBgLayout,
    bgPosition,
    bgBrightness,
    globalBrightness,
    globalBg,
  };
}
