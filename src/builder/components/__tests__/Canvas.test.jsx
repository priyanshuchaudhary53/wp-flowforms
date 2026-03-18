import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Canvas from "../Canvas";
import { useFormStore } from "../../store/useFormStore";
import { FONT_SCALE } from "../design/fontScale";

// Mock loadGoogleFont — we don't want real network requests in tests
vi.mock("../../lib/googleFonts", () => ({
  loadGoogleFont: vi.fn(),
  GOOGLE_FONTS: ["Inter", "Roboto"],
}));

function makeForm(overrides = {}) {
  return {
    id: 1,
    title: "Test",
    content: {
      welcomeScreen: {
        content: { title: "Welcome!", description: "Intro", buttonLabel: "Start" },
        settings: {},
      },
      thankYouScreen: {
        content: { title: "Thank you!", description: "" },
        settings: {},
      },
      questions: [],
      design: {},
      ...overrides,
    },
  };
}

beforeEach(() => {
  useFormStore.setState({
    formId: 1,
    form: makeForm(),
    selectedBlock: { id: "welcome", type: "welcome" },
    draftDesign: null,
    designDrawerOpen: false,
    pendingInsert: null,
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────
describe("Canvas — empty state", () => {
  it("shows empty state when no block is selected", () => {
    useFormStore.setState({ selectedBlock: null });
    render(<Canvas />);
    expect(screen.getByText(/select a block/i)).toBeInTheDocument();
  });
});

// ── Welcome screen preview ────────────────────────────────────────────────────
describe("Canvas — welcome screen preview", () => {
  it("renders welcome title", () => {
    render(<Canvas />);
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("renders welcome description", () => {
    render(<Canvas />);
    expect(screen.getByText("Intro")).toBeInTheDocument();
  });

  it("renders start button label", () => {
    render(<Canvas />);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("shows default 'Welcome!' when title is empty", () => {
    useFormStore.setState({
      form: makeForm({
        welcomeScreen: { content: { title: "" }, settings: {} },
      }),
    });
    render(<Canvas />);
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });
});

// ── Thank you screen preview ──────────────────────────────────────────────────
describe("Canvas — thank you screen preview", () => {
  beforeEach(() => {
    useFormStore.setState({
      selectedBlock: { id: "thankYou", type: "thankYou" },
    });
  });

  it("renders thank you title", () => {
    render(<Canvas />);
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });

  it("shows the checkmark SVG", () => {
    const { container } = render(<Canvas />);
    // The checkmark path is uniquely identifiable
    expect(container.querySelector("path[d='M5 13l4 4L19 7']")).toBeInTheDocument();
  });

  it("shows default 'Thank you!' when title is empty", () => {
    useFormStore.setState({
      form: makeForm({
        thankYouScreen: { content: { title: "" }, settings: {} },
      }),
      selectedBlock: { id: "thankYou", type: "thankYou" },
    });
    render(<Canvas />);
    expect(screen.getByText("Thank you!")).toBeInTheDocument();
  });
});

// ── Question preview ──────────────────────────────────────────────────────────
describe("Canvas — question previews", () => {
  function setupQuestion(question) {
    useFormStore.setState({
      form: makeForm({ questions: [question] }),
      selectedBlock: { id: question.id, type: "question", questionType: question.type },
    });
  }

  it("renders short_text question with placeholder input", () => {
    setupQuestion({
      id: "q1", type: "short_text",
      content: { title: "Your name?" },
      settings: { placeholder: "Enter name" },
    });
    render(<Canvas />);
    expect(screen.getByText("Your name?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("renders long_text question with textarea", () => {
    setupQuestion({
      id: "q1", type: "long_text",
      content: { title: "Tell us more" },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders email question with email input", () => {
    setupQuestion({
      id: "q1", type: "email",
      content: { title: "Email?" },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
  });

  it("renders multiple_choice with default options when none defined", () => {
    setupQuestion({
      id: "q1", type: "multiple_choice",
      content: { title: "Pick one", options: [] },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("renders multiple_choice with custom options", () => {
    setupQuestion({
      id: "q1", type: "multiple_choice",
      content: { title: "Pick", options: [{ label: "Red" }, { label: "Blue" }] },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("renders yes_no buttons", () => {
    setupQuestion({
      id: "q1", type: "yes_no",
      content: { title: "Are you sure?", yesLabel: "Yep", noLabel: "Nope" },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByText("Yep")).toBeInTheDocument();
    expect(screen.getByText("Nope")).toBeInTheDocument();
  });

  it("renders rating with correct number of stars", () => {
    setupQuestion({
      id: "q1", type: "rating",
      content: { title: "Rate us" },
      settings: { steps: 3 },
    });
    render(<Canvas />);
    const { container } = render(<Canvas />);
    // Each star is a button
    expect(container.querySelectorAll("button[style*='--star-color']").length).toBeGreaterThanOrEqual(3);
  });

  it("caps rating steps at 10", () => {
    setupQuestion({
      id: "q1", type: "rating",
      content: { title: "Rate us" },
      settings: { steps: 99 },
    });
    const { container } = render(<Canvas />);
    expect(container.querySelectorAll("button[style*='--star-color']").length).toBeLessThanOrEqual(10);
  });

  it("shows 'Untitled question' default title", () => {
    setupQuestion({
      id: "q1", type: "short_text",
      content: { title: "" },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByText("Untitled question")).toBeInTheDocument();
  });

  it("shows 'No preview available' for unknown block type", () => {
    setupQuestion({
      id: "q1", type: "unknown_future_type",
      content: { title: "?" },
      settings: {},
    });
    render(<Canvas />);
    expect(screen.getByText(/no preview available/i)).toBeInTheDocument();
  });
});

// ── CSS variables from design ────────────────────────────────────────────────
describe("Canvas — design CSS variables", () => {
  it("applies bg_color as backgroundColor on the canvas div", () => {
    useFormStore.setState({
      form: makeForm({ design: { bg_color: "#123456" } }),
    });
    const { container } = render(<Canvas />);
    const canvas = container.firstChild.nextSibling ?? container.firstChild;
    // The outermost div after <style>
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.backgroundColor).toBe("rgb(18, 52, 86)");
  });

  it("applies --btn-color CSS variable", () => {
    useFormStore.setState({
      form: makeForm({ design: { button_color: "#aabbcc" } }),
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.getPropertyValue("--btn-color")).toBe("#aabbcc");
  });

  it("applies --corner-radius: 0px for angular border_radius", () => {
    useFormStore.setState({
      form: makeForm({ design: { border_radius: "angular" } }),
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.getPropertyValue("--corner-radius")).toBe("0px");
  });

  it("applies --corner-radius: 9999px for full border_radius", () => {
    useFormStore.setState({
      form: makeForm({ design: { border_radius: "full" } }),
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.getPropertyValue("--corner-radius")).toBe("9999px");
  });

  it("applies font-scale CSS variables for 'large' font_size", () => {
    useFormStore.setState({
      form: makeForm({ design: { font_size: "large" } }),
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.getPropertyValue("--fs-title")).toBe(FONT_SCALE.large.title);
  });

  it("falls back to regular font scale for unknown font_size", () => {
    useFormStore.setState({
      form: makeForm({ design: { font_size: "mystery" } }),
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.getPropertyValue("--fs-title")).toBe(FONT_SCALE.regular.title);
  });

  it("uses draftDesign when designDrawerOpen is true", () => {
    useFormStore.setState({
      form: makeForm({ design: { bg_color: "#committed" } }),
      draftDesign: { bg_color: "#dddddd" },
      designDrawerOpen: true,
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.backgroundColor).toBe("rgb(221, 221, 221)");
  });

  it("uses committed design when designDrawerOpen is false", () => {
    useFormStore.setState({
      form: makeForm({ design: { bg_color: "#111111" } }),
      draftDesign: { bg_color: "#dddddd" },
      designDrawerOpen: false,
    });
    const { container } = render(<Canvas />);
    const canvasDiv = container.querySelector("div[class*='rounded-2xl']");
    expect(canvasDiv.style.backgroundColor).toBe("rgb(17, 17, 17)");
  });
});

// ── Insert buttons ────────────────────────────────────────────────────────────
describe("Canvas — insert buttons", () => {
  function setupQuestion() {
    const q = { id: "q1", type: "short_text", content: { title: "Q" }, settings: {} };
    useFormStore.setState({
      form: makeForm({ questions: [q] }),
      selectedBlock: { id: "q1", type: "question", questionType: "short_text" },
    });
  }

  it("shows insert-before and insert-after buttons for a question", () => {
    setupQuestion();
    render(<Canvas />);
    expect(screen.getByTitle("Insert block before")).toBeInTheDocument();
    expect(screen.getByTitle("Insert block after")).toBeInTheDocument();
  });

  it("clicking insert-before sets pendingInsert to selectedIndex (0)", async () => {
    setupQuestion();
    const user = userEvent.setup();
    render(<Canvas />);
    await user.click(screen.getByTitle("Insert block before"));
    expect(useFormStore.getState().pendingInsert).toBe(0);
  });

  it("clicking insert-after sets pendingInsert to selectedIndex + 1 (1)", async () => {
    setupQuestion();
    const user = userEvent.setup();
    render(<Canvas />);
    await user.click(screen.getByTitle("Insert block after"));
    expect(useFormStore.getState().pendingInsert).toBe(1);
  });

  it("does not show insert buttons for welcome screen", () => {
    render(<Canvas />);
    expect(screen.queryByTitle("Insert block before")).not.toBeInTheDocument();
  });
});
