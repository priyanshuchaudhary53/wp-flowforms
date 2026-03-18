import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeGallery from "../ThemeGallery";
import THEMES from "../themes";

describe("ThemeGallery", () => {
  it("does not render anything when open=false", () => {
    render(<ThemeGallery open={false} onOpenChange={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText("Theme Gallery")).not.toBeInTheDocument();
  });

  it("renders the dialog title when open=true", () => {
    render(<ThemeGallery open={true} onOpenChange={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Theme Gallery")).toBeInTheDocument();
  });

  it("renders a card for every theme", () => {
    render(<ThemeGallery open={true} onOpenChange={vi.fn()} onApply={vi.fn()} />);
    for (const theme of THEMES) {
      expect(screen.getByText(theme.name)).toBeInTheDocument();
    }
  });

  it("calls onApply with the theme when a card is clicked", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();
    render(<ThemeGallery open={true} onOpenChange={vi.fn()} onApply={onApply} />);
    await user.click(screen.getByText(THEMES[0].name));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: THEMES[0].id }));
  });

  it("calls onOpenChange(false) after a theme is applied", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ThemeGallery open={true} onOpenChange={onOpenChange} onApply={vi.fn()} />);
    await user.click(screen.getByText(THEMES[0].name));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("THEMES data", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(THEMES)).toBe(true);
    expect(THEMES.length).toBeGreaterThan(0);
  });

  it("every theme has a unique id and name", () => {
    const ids   = THEMES.map((t) => t.id);
    const names = THEMES.map((t) => t.name);
    expect(new Set(ids).size).toBe(THEMES.length);
    expect(new Set(names).size).toBe(THEMES.length);
  });

  it("every theme provides all required color keys", () => {
    const REQUIRED = [
      "bg_color", "title_color", "description_color", "answer_color",
      "button_color", "button_hover_color", "button_text_color",
      "hint_color", "star_color",
    ];
    for (const theme of THEMES) {
      for (const key of REQUIRED) {
        expect(theme).toHaveProperty(key);
        expect(theme[key]).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    }
  });
});
