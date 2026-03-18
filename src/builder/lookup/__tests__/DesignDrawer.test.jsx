import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesignDrawer from "../DesignDrawer";
import { useFormStore } from "../../store/useFormStore";

function makeForm(designOverrides = {}) {
  return {
    id: 1,
    title: "Test",
    content: {
      welcomeScreen: { content: {}, settings: {} },
      thankYouScreen: { content: {}, settings: {} },
      questions: [],
      design: designOverrides,
    },
  };
}

beforeEach(() => {
  useFormStore.setState({
    formId: 1,
    form: makeForm(),
    designDrawerOpen: true,
    draftDesign: {},
    designDirty: false,
  });
});

// ── Rendering ──────────────────────────────────────────────────────────────────
describe("DesignDrawer — rendering", () => {
  it("renders the sheet title when open", () => {
    render(<DesignDrawer />);
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("renders the Open theme gallery button", () => {
    render(<DesignDrawer />);
    expect(screen.getByText(/open theme gallery/i)).toBeInTheDocument();
  });

  it("renders all design section names", () => {
    render(<DesignDrawer />);
    expect(screen.getByText("Colours")).toBeInTheDocument();
    expect(screen.getByText("Layout")).toBeInTheDocument();
    expect(screen.getByText("Typography")).toBeInTheDocument();
    // "Background" also appears as a color field label, so use getAllByText
    expect(screen.getAllByText("Background").length).toBeGreaterThan(0);
  });

  it("Save changes button is disabled when not dirty", () => {
    useFormStore.setState({ designDirty: false });
    render(<DesignDrawer />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save changes button is enabled when dirty", () => {
    useFormStore.setState({ designDirty: true });
    render(<DesignDrawer />);
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });
});

// ── Brightness slider visibility ───────────────────────────────────────────────
describe("DesignDrawer — brightness slider visibility", () => {
  it("hides the brightness slider when no bg_image is set", () => {
    useFormStore.setState({ draftDesign: { bg_image: null } });
    render(<DesignDrawer />);
    expect(screen.queryByText("Brightness")).not.toBeInTheDocument();
  });

  it("shows the brightness slider when a bg_image is set", () => {
    useFormStore.setState({
      draftDesign: { bg_image: { id: 1, url: "http://example.com/img.jpg" } },
    });
    render(<DesignDrawer />);
    expect(screen.getByText("Brightness")).toBeInTheDocument();
  });
});

// ── Brightness reset regression test ─────────────────────────────────────────
describe("DesignDrawer — brightness reset on image removal (regression)", () => {
  it("resets bg_brightness to 0 when bg_image is removed", async () => {
    useFormStore.setState({
      draftDesign: {
        bg_image: { id: 1, url: "http://example.com/img.jpg" },
        bg_brightness: 50,
      },
      designDirty: true,
    });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByTitle("Remove image"));
    expect(useFormStore.getState().draftDesign.bg_image).toBeNull();
    expect(useFormStore.getState().draftDesign.bg_brightness).toBe(0);
  });
});

// ── Close / discard flow ──────────────────────────────────────────────────────
describe("DesignDrawer — close flow", () => {
  it("closes immediately when Close is clicked and not dirty", async () => {
    useFormStore.setState({ designDirty: false });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(useFormStore.getState().designDrawerOpen).toBe(false);
  });

  it("shows discard confirm dialog when Close is clicked with dirty changes", async () => {
    useFormStore.setState({ designDirty: true });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(screen.getByText(/discard design changes/i)).toBeInTheDocument();
  });

  it("discards and closes when 'Yes, discard' is confirmed", async () => {
    useFormStore.setState({ designDirty: true, draftDesign: { bg_color: "#f00" } });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    await user.click(screen.getByRole("button", { name: /yes, discard/i }));
    expect(useFormStore.getState().designDrawerOpen).toBe(false);
    expect(useFormStore.getState().designDirty).toBe(false);
  });

  it("dismisses the discard dialog when 'No, keep editing' is clicked", async () => {
    useFormStore.setState({ designDirty: true });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    await user.click(screen.getByRole("button", { name: /no, keep editing/i }));
    expect(screen.queryByText(/discard design changes/i)).not.toBeInTheDocument();
    // Drawer should still be open
    expect(useFormStore.getState().designDrawerOpen).toBe(true);
  });
});

// ── Save flow ─────────────────────────────────────────────────────────────────
describe("DesignDrawer — save flow", () => {
  it("shows save confirm dialog when Save changes is clicked", async () => {
    useFormStore.setState({ designDirty: true });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(screen.getByText(/publish design changes/i)).toBeInTheDocument();
  });

  it("commits design and closes when 'Yes, save' is confirmed", async () => {
    useFormStore.setState({
      form: makeForm(),
      designDrawerOpen: true,
      designDirty: true,
      draftDesign: { bg_color: "#abcdef" },
    });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await user.click(screen.getByRole("button", { name: /yes, save/i }));
    expect(useFormStore.getState().form.content.design.bg_color).toBe("#abcdef");
    expect(useFormStore.getState().designDrawerOpen).toBe(false);
    expect(useFormStore.getState().designDirty).toBe(false);
  });

  it("dismisses the save dialog when 'No, go back' is clicked", async () => {
    useFormStore.setState({ designDirty: true });
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await user.click(screen.getByRole("button", { name: /no, go back/i }));
    expect(screen.queryByText(/publish design changes/i)).not.toBeInTheDocument();
  });
});

// ── Theme gallery ─────────────────────────────────────────────────────────────
describe("DesignDrawer — theme gallery", () => {
  it("opens the theme gallery when the trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<DesignDrawer />);
    await user.click(screen.getByText(/open theme gallery/i));
    expect(screen.getByText("Theme Gallery")).toBeInTheDocument();
  });
});
