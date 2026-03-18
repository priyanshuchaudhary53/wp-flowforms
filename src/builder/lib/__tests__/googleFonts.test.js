import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GOOGLE_FONTS, loadGoogleFont } from "../googleFonts";

describe("GOOGLE_FONTS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(GOOGLE_FONTS)).toBe(true);
    expect(GOOGLE_FONTS.length).toBeGreaterThan(0);
  });

  it("contains common well-known fonts", () => {
    expect(GOOGLE_FONTS).toContain("Inter");
    expect(GOOGLE_FONTS).toContain("Roboto");
    expect(GOOGLE_FONTS).toContain("Montserrat");
  });

  it("contains only strings", () => {
    expect(GOOGLE_FONTS.every((f) => typeof f === "string")).toBe(true);
  });

  it("has no duplicates", () => {
    expect(new Set(GOOGLE_FONTS).size).toBe(GOOGLE_FONTS.length);
  });
});

describe("loadGoogleFont", () => {
  beforeEach(() => {
    // Remove any font links that were added in previous tests
    document.querySelectorAll("link[id^='gf-']").forEach((el) => el.remove());
  });

  afterEach(() => {
    document.querySelectorAll("link[id^='gf-']").forEach((el) => el.remove());
  });

  it("injects a <link> tag into document.head", () => {
    loadGoogleFont("Inter");
    const link = document.getElementById("gf-Inter");
    expect(link).not.toBeNull();
    expect(link.tagName).toBe("LINK");
  });

  it("sets rel='stylesheet' on the injected link", () => {
    loadGoogleFont("Roboto");
    const link = document.getElementById("gf-Roboto");
    expect(link.rel).toBe("stylesheet");
  });

  it("includes the font name in the href", () => {
    loadGoogleFont("Open Sans");
    const link = document.getElementById("gf-Open-Sans");
    expect(link.href).toContain("Open%20Sans");
  });

  it("uses a hyphenated id for fonts with spaces", () => {
    loadGoogleFont("Playfair Display");
    const link = document.getElementById("gf-Playfair-Display");
    expect(link).not.toBeNull();
  });

  it("is idempotent — does not add a duplicate link on repeated calls", () => {
    loadGoogleFont("Lato");
    loadGoogleFont("Lato");
    const links = document.querySelectorAll("#gf-Lato");
    expect(links.length).toBe(1);
  });

  it("does nothing when fontName is falsy", () => {
    const countBefore = document.querySelectorAll("link[id^='gf-']").length;
    loadGoogleFont("");
    loadGoogleFont(null);
    loadGoogleFont(undefined);
    const countAfter = document.querySelectorAll("link[id^='gf-']").length;
    expect(countAfter).toBe(countBefore);
  });
});
