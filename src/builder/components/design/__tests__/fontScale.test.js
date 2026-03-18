import { describe, expect, it } from "vitest";
import { FONT_SCALE, getFontScale } from "../fontScale";

describe("FONT_SCALE", () => {
  it("exports three size variants: small, regular, large", () => {
    expect(Object.keys(FONT_SCALE)).toEqual(["small", "regular", "large"]);
  });

  it("each variant has all four semantic roles", () => {
    for (const scale of Object.values(FONT_SCALE)) {
      expect(scale).toHaveProperty("title");
      expect(scale).toHaveProperty("subtitle");
      expect(scale).toHaveProperty("body");
      expect(scale).toHaveProperty("hint");
    }
  });

  it("title is larger than subtitle in every scale", () => {
    for (const scale of Object.values(FONT_SCALE)) {
      const title    = parseFloat(scale.title);
      const subtitle = parseFloat(scale.subtitle);
      expect(title).toBeGreaterThan(subtitle);
    }
  });

  it("subtitle is larger than body in every scale", () => {
    for (const scale of Object.values(FONT_SCALE)) {
      const subtitle = parseFloat(scale.subtitle);
      const body     = parseFloat(scale.body);
      expect(subtitle).toBeGreaterThan(body);
    }
  });

  it("large title is bigger than regular title is bigger than small title", () => {
    expect(parseFloat(FONT_SCALE.large.title))
      .toBeGreaterThan(parseFloat(FONT_SCALE.regular.title));
    expect(parseFloat(FONT_SCALE.regular.title))
      .toBeGreaterThan(parseFloat(FONT_SCALE.small.title));
  });

  it("all values are rem strings", () => {
    for (const scale of Object.values(FONT_SCALE)) {
      for (const val of Object.values(scale)) {
        expect(val).toMatch(/^\d+(\.\d+)?rem$/);
      }
    }
  });
});

describe("getFontScale", () => {
  it("returns the small scale for 'small'", () => {
    expect(getFontScale("small")).toBe(FONT_SCALE.small);
  });

  it("returns the regular scale for 'regular'", () => {
    expect(getFontScale("regular")).toBe(FONT_SCALE.regular);
  });

  it("returns the large scale for 'large'", () => {
    expect(getFontScale("large")).toBe(FONT_SCALE.large);
  });

  it("falls back to regular for unknown keys", () => {
    expect(getFontScale("xlarge")).toBe(FONT_SCALE.regular);
    expect(getFontScale(undefined)).toBe(FONT_SCALE.regular);
    expect(getFontScale(null)).toBe(FONT_SCALE.regular);
    expect(getFontScale("")).toBe(FONT_SCALE.regular);
  });
});
