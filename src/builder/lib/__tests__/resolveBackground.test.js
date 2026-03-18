import { describe, expect, it } from "vitest";
import { resolveBackground } from "../resolveBackground";

const GLOBAL = {
  bg_image: { url: "http://example.com/global.jpg" },
  bg_brightness: -30,
};

const LOCAL_URL  = "http://example.com/local.jpg";
const GLOBAL_URL = "http://example.com/global.jpg";

// ── No images ─────────────────────────────────────────────────────────────────
describe("resolveBackground — no images", () => {
  it("bgImage is null when neither local nor global image is set", () => {
    const r = resolveBackground({}, {});
    expect(r.bgImage).toBeNull();
  });

  it("globalBg is null when there is no global image", () => {
    const r = resolveBackground({}, {});
    expect(r.globalBg).toBeNull();
  });

  it("bgBrightness defaults to 0", () => {
    const r = resolveBackground({}, {});
    expect(r.bgBrightness).toBe(0);
  });

  it("globalBrightness defaults to 0", () => {
    const r = resolveBackground({}, {});
    expect(r.globalBrightness).toBe(0);
  });

  it("bgLayout defaults to wallpaper", () => {
    const r = resolveBackground({}, {});
    expect(r.bgLayout).toBe("wallpaper");
  });

  it("bgPosition defaults to left", () => {
    const r = resolveBackground({}, {});
    expect(r.bgPosition).toBe("left");
  });
});

// ── Global image only (no local image) ───────────────────────────────────────
describe("resolveBackground — global image, no local image", () => {
  it("uses global image as bgImage", () => {
    const r = resolveBackground({}, GLOBAL);
    expect(r.bgImage).toBe(GLOBAL_URL);
  });

  it("globalBg is null (global is already bgImage, not behind split)", () => {
    const r = resolveBackground({}, GLOBAL);
    expect(r.globalBg).toBeNull();
  });

  it("applies global brightness to bgBrightness", () => {
    const r = resolveBackground({}, GLOBAL);
    expect(r.bgBrightness).toBe(-30);
  });

  it("bgLayout is wallpaper by default", () => {
    const r = resolveBackground({}, GLOBAL);
    expect(r.bgLayout).toBe("wallpaper");
  });
});

// ── Local wallpaper overrides global ─────────────────────────────────────────
describe("resolveBackground — local wallpaper layout", () => {
  const settings = {
    backgroundImage: { url: LOCAL_URL },
    bgLayout: "wallpaper",
    bgBrightness: 20,
  };

  it("uses the local image as bgImage", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgImage).toBe(LOCAL_URL);
  });

  it("globalBg is null — global is fully ignored in local wallpaper mode", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.globalBg).toBeNull();
  });

  it("bgBrightness uses the local block brightness, not global", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgBrightness).toBe(20);
  });

  it("globalBrightness still reflects the design-level setting", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.globalBrightness).toBe(-30);
  });

  it("bgLayout is wallpaper", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgLayout).toBe("wallpaper");
  });
});

// ── Local split + global ─────────────────────────────────────────────────────
describe("resolveBackground — local split layout with global image", () => {
  const settings = {
    backgroundImage: { url: LOCAL_URL },
    bgLayout: "split",
    bgPosition: "right",
    bgBrightness: 10,
  };

  it("bgImage is the local image (shown in the split panel)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgImage).toBe(LOCAL_URL);
  });

  it("globalBg is the global image (rendered behind the split)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.globalBg).toBe(GLOBAL_URL);
  });

  it("bgBrightness uses local block value (not global)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgBrightness).toBe(10);
  });

  it("globalBrightness tracks design-level brightness", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.globalBrightness).toBe(-30);
  });

  it("bgLayout is split", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgLayout).toBe("split");
  });

  it("bgPosition is preserved", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgPosition).toBe("right");
  });
});

// ── Split layout without a local image (falls back to global) ────────────────
describe("resolveBackground — split layout with no local image", () => {
  const settings = { bgLayout: "split" };

  it("bgImage is null (no local image in split panel)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgImage).toBeNull();
  });

  it("globalBg is the global image (appears behind the empty split)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.globalBg).toBe(GLOBAL_URL);
  });

  it("bgBrightness uses global brightness (no local brightness to apply)", () => {
    const r = resolveBackground(settings, GLOBAL);
    expect(r.bgBrightness).toBe(-30);
  });
});

// ── Null / undefined edge cases ───────────────────────────────────────────────
describe("resolveBackground — null/undefined safety", () => {
  it("handles null settings gracefully", () => {
    expect(() => resolveBackground(null, GLOBAL)).not.toThrow();
  });

  it("handles null design gracefully", () => {
    expect(() => resolveBackground({}, null)).not.toThrow();
  });

  it("handles both null", () => {
    const r = resolveBackground(null, null);
    expect(r.bgImage).toBeNull();
    expect(r.globalBg).toBeNull();
    expect(r.bgBrightness).toBe(0);
  });

  it("treats bg_image with no url as no global image", () => {
    const r = resolveBackground({}, { bg_image: {} });
    expect(r.bgImage).toBeNull();
  });

  it("treats backgroundImage with no url as no local image", () => {
    const r = resolveBackground({ backgroundImage: {} }, GLOBAL);
    expect(r.bgImage).toBe(GLOBAL_URL);
  });
});

// ── Brightness edge values ────────────────────────────────────────────────────
describe("resolveBackground — brightness edge values", () => {
  it("globalBrightness is 0 when design has no bg_brightness", () => {
    const r = resolveBackground({}, { bg_image: { url: GLOBAL_URL } });
    expect(r.globalBrightness).toBe(0);
  });

  it("positive globalBrightness is preserved", () => {
    const r = resolveBackground({}, { bg_image: { url: GLOBAL_URL }, bg_brightness: 50 });
    expect(r.globalBrightness).toBe(50);
  });

  it("negative globalBrightness is preserved", () => {
    const r = resolveBackground({}, { bg_image: { url: GLOBAL_URL }, bg_brightness: -100 });
    expect(r.globalBrightness).toBe(-100);
  });
});
