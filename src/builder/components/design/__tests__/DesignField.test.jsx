import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesignField from "../DesignField";

// ── Helper: make a minimal field definition ───────────────────────────────────
const makeField = (overrides) => ({
  key: "test_key",
  label: "Test Label",
  default: "",
  hint: "",
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// ToggleField
// ═══════════════════════════════════════════════════════════════════════════════
describe("ToggleField", () => {
  const field = makeField({ type: "toggle", label: "Required", default: false });

  it("renders the label", () => {
    render(<DesignField field={field} value={false} onChange={vi.fn()} />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("shows aria-checked=false when value is false", () => {
    render(<DesignField field={field} value={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("shows aria-checked=true when value is true", () => {
    render(<DesignField field={field} value={true} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with true when toggled from false", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DesignField field={field} value={false} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when toggled from true", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DesignField field={field} value={true} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("renders hint text when provided", () => {
    const f = makeField({ type: "toggle", label: "Req", hint: "Must answer", default: false });
    render(<DesignField field={f} value={false} onChange={vi.fn()} />);
    expect(screen.getByText("Must answer")).toBeInTheDocument();
  });

  it("falls back to field.default when value is undefined", () => {
    render(<DesignField field={field} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SelectField
// ═══════════════════════════════════════════════════════════════════════════════
describe("SelectField", () => {
  const field = makeField({
    type: "select",
    label: "Font size",
    default: "regular",
    options: [
      { label: "Small", value: "small" },
      { label: "Regular", value: "regular" },
      { label: "Large", value: "large" },
    ],
  });

  it("renders all option buttons", () => {
    render(<DesignField field={field} value="regular" onChange={vi.fn()} />);
    // getAllByText because SelectField renders both a hidden <option> and a visible <button>
    expect(screen.getAllByText("Small").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Regular").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Large").length).toBeGreaterThan(0);
  });

  it("marks the current value as pressed", () => {
    render(<DesignField field={field} value="large" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute("aria-pressed", "true");
  });

  it("marks other options as not pressed", () => {
    render(<DesignField field={field} value="large" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Small" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the option value when clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DesignField field={field} value="regular" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Small" }));
    expect(onChange).toHaveBeenCalledWith("small");
  });

  it("falls back to field.default when value is undefined", () => {
    render(<DesignField field={field} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Regular" })).toHaveAttribute("aria-pressed", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// BrightnessSliderField
// ═══════════════════════════════════════════════════════════════════════════════
describe("BrightnessSliderField", () => {
  const field = makeField({ type: "brightness_slider", label: "Brightness", default: 0 });

  it("renders the label", () => {
    render(<DesignField field={field} value={0} onChange={vi.fn()} />);
    expect(screen.getByText("Brightness")).toBeInTheDocument();
  });

  it("shows '0' as current brightness", () => {
    render(<DesignField field={field} value={0} onChange={vi.fn()} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows '+50' for positive brightness", () => {
    render(<DesignField field={field} value={50} onChange={vi.fn()} />);
    expect(screen.getByText("+50")).toBeInTheDocument();
  });

  it("shows '-30' for negative brightness", () => {
    render(<DesignField field={field} value={-30} onChange={vi.fn()} />);
    expect(screen.getByText("-30")).toBeInTheDocument();
  });

  it("calls onChange with a number when slider changes", () => {
    const onChange = vi.fn();
    render(<DesignField field={field} value={0} onChange={onChange} />);
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "40" } });
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it("slider has min=-100, max=100, step=10", () => {
    render(<DesignField field={field} value={0} onChange={vi.fn()} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "-100");
    expect(slider).toHaveAttribute("max", "100");
    expect(slider).toHaveAttribute("step", "10");
  });

  it("falls back to field.default (0) when value is undefined", () => {
    render(<DesignField field={field} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MediaImageField
// ═══════════════════════════════════════════════════════════════════════════════
describe("MediaImageField", () => {
  const field = makeField({ type: "media_image", label: "Background image", default: null });

  it("shows 'Select image' button when no image is set", () => {
    render(<DesignField field={field} value={null} onChange={vi.fn()} />);
    expect(screen.getByText("Select image")).toBeInTheDocument();
  });

  it("shows the image thumbnail when a value is provided", () => {
    const value = { id: 1, url: "http://example.com/bg.jpg" };
    render(<DesignField field={field} value={value} onChange={vi.fn()} />);
    const img = screen.getByAltText("Background");
    expect(img).toHaveAttribute("src", "http://example.com/bg.jpg");
  });

  it("shows Remove and Replace buttons when an image is set", () => {
    const value = { id: 1, url: "http://example.com/bg.jpg" };
    render(<DesignField field={field} value={value} onChange={vi.fn()} />);
    expect(screen.getByTitle("Remove image")).toBeInTheDocument();
    expect(screen.getByTitle("Replace image")).toBeInTheDocument();
  });

  it("calls onChange(null) when Remove is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const value = { id: 1, url: "http://example.com/bg.jpg" };
    render(<DesignField field={field} value={value} onChange={onChange} />);
    await user.click(screen.getByTitle("Remove image"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("opens the wp.media frame when Select image is clicked", async () => {
    const user = userEvent.setup();
    render(<DesignField field={field} value={null} onChange={vi.fn()} />);
    await user.click(screen.getByText("Select image"));
    expect(wp.media).toHaveBeenCalled();
  });

  it("calls onMediaOpen when wp.media frame opens", async () => {
    const onMediaOpen = vi.fn();
    const user = userEvent.setup();
    // Simulate the 'open' event firing
    wp.media.mockImplementation(() => ({
      on: vi.fn((event, cb) => { if (event === "open") cb(); }),
      open: vi.fn(),
      state: vi.fn(),
    }));
    render(
      <DesignField
        field={field}
        value={null}
        onChange={vi.fn()}
        onMediaOpen={onMediaOpen}
        onMediaClose={vi.fn()}
      />
    );
    await user.click(screen.getByText("Select image"));
    expect(onMediaOpen).toHaveBeenCalled();
  });

  it("does not render image when value has no url", () => {
    render(<DesignField field={field} value={{ id: 1 }} onChange={vi.fn()} />);
    expect(screen.getByText("Select image")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ColorField
// ═══════════════════════════════════════════════════════════════════════════════
describe("ColorField", () => {
  const field = makeField({ type: "color", label: "Background", default: "#ffffff" });

  it("renders the label", () => {
    render(<DesignField field={field} value="#ffffff" onChange={vi.fn()} />);
    expect(screen.getByText("Background")).toBeInTheDocument();
  });

  it("shows the current hex value in the text input", () => {
    render(<DesignField field={field} value="#abcdef" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("#abcdef")).toBeInTheDocument();
  });

  it("calls onChange when a valid hex is typed", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DesignField field={field} value="#ffffff" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    // Type a complete valid 6-digit hex value — ColorField calls onChange
    // for each incremental character that matches #[0-9a-fA-F]{0,6}
    fireEvent.change(input, { target: { value: "#aabbcc" } });
    expect(onChange).toHaveBeenCalledWith("#aabbcc");
  });

  it("falls back to field.default when value is undefined", () => {
    render(<DesignField field={field} value={undefined} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("#ffffff")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GoogleFontField
// ═══════════════════════════════════════════════════════════════════════════════
describe("GoogleFontField", () => {
  const field = makeField({ type: "google_font", label: "Font family", default: "" });

  it("renders the label", () => {
    render(<DesignField field={field} value="" onChange={vi.fn()} />);
    expect(screen.getByText("Font family")).toBeInTheDocument();
  });

  it("shows placeholder when no font is selected", () => {
    render(<DesignField field={field} value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Default (system font)")).toBeInTheDocument();
  });

  it("shows the selected font name in the input", () => {
    render(<DesignField field={field} value="Inter" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("Inter")).toBeInTheDocument();
  });

  it("shows a clear button when a font is selected", () => {
    render(<DesignField field={field} value="Roboto" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Clear font")).toBeInTheDocument();
  });

  it("does not show clear button when no font is selected", () => {
    render(<DesignField field={field} value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Clear font")).not.toBeInTheDocument();
  });

  it("calls onChange('') when clear is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DesignField field={field} value="Inter" onChange={onChange} />);
    await user.click(screen.getByLabelText("Clear font"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("opens dropdown when input is focused", async () => {
    const user = userEvent.setup();
    render(<DesignField field={field} value="" onChange={vi.fn()} />);
    await user.click(screen.getByPlaceholderText("Default (system font)"));
    // Dropdown should show fonts
    expect(screen.getByText("Inter")).toBeInTheDocument();
  });

  it("filters fonts when typing in the input", async () => {
    const user = userEvent.setup();
    render(<DesignField field={field} value="" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("Default (system font)");
    await user.type(input, "Inter");
    expect(screen.getAllByText("Inter").length).toBeGreaterThan(0);
    // Roboto should not appear since it does not match "Inter"
    expect(screen.queryByText("Roboto")).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DesignField dispatcher (default / unknown type)
// ═══════════════════════════════════════════════════════════════════════════════
describe("DesignField — unknown type falls back to TextField", () => {
  it("renders a text input for an unrecognized type", () => {
    const field = makeField({ type: "unknown_type", label: "Custom", default: "hello" });
    render(<DesignField field={field} value="hello" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });
});
