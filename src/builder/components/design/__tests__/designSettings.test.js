import { describe, expect, it } from "vitest";
import DESIGN_SETTINGS from "../designSettings";

describe("DESIGN_SETTINGS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(DESIGN_SETTINGS)).toBe(true);
    expect(DESIGN_SETTINGS.length).toBeGreaterThan(0);
  });

  it("every section has a section name and fields array", () => {
    for (const section of DESIGN_SETTINGS) {
      expect(typeof section.section).toBe("string");
      expect(Array.isArray(section.fields)).toBe(true);
    }
  });

  it("contains the four expected sections", () => {
    const names = DESIGN_SETTINGS.map((s) => s.section);
    expect(names).toContain("Colours");
    expect(names).toContain("Layout");
    expect(names).toContain("Typography");
    expect(names).toContain("Background");
  });

  it("every field has key, label, type and default", () => {
    for (const section of DESIGN_SETTINGS) {
      for (const field of section.fields) {
        expect(field).toHaveProperty("key");
        expect(field).toHaveProperty("label");
        expect(field).toHaveProperty("type");
        expect(field).toHaveProperty("default");
      }
    }
  });

  it("Colours section has exactly nine color fields", () => {
    const colours = DESIGN_SETTINGS.find((s) => s.section === "Colours");
    expect(colours.fields).toHaveLength(9);
    expect(colours.fields.every((f) => f.type === "color")).toBe(true);
  });

  it("all color fields have hex defaults starting with #", () => {
    const colours = DESIGN_SETTINGS.find((s) => s.section === "Colours");
    for (const field of colours.fields) {
      expect(field.default).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("Background section contains bg_image (media_image) and bg_brightness (brightness_slider)", () => {
    const bg = DESIGN_SETTINGS.find((s) => s.section === "Background");
    const types = bg.fields.map((f) => f.type);
    expect(types).toContain("media_image");
    expect(types).toContain("brightness_slider");
  });

  it("bg_brightness default is 0", () => {
    const bg = DESIGN_SETTINGS.find((s) => s.section === "Background");
    const slider = bg.fields.find((f) => f.type === "brightness_slider");
    expect(slider.default).toBe(0);
  });

  it("bg_image default is null", () => {
    const bg = DESIGN_SETTINGS.find((s) => s.section === "Background");
    const img = bg.fields.find((f) => f.type === "media_image");
    expect(img.default).toBeNull();
  });

  it("select fields have non-empty options arrays", () => {
    for (const section of DESIGN_SETTINGS) {
      for (const field of section.fields) {
        if (field.type === "select") {
          expect(Array.isArray(field.options)).toBe(true);
          expect(field.options.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("all field keys are unique across the entire settings schema", () => {
    const keys = DESIGN_SETTINGS.flatMap((s) => s.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
