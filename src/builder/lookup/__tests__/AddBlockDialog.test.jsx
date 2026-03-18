import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddBlockDialog from "../AddBlockDialog";
import { useFormStore } from "../../store/useFormStore";
import FIELDS from "../../components/left-panel/fields";

function makeForm() {
  return {
    id: 1,
    title: "Test",
    content: {
      welcomeScreen: { content: {}, settings: {} },
      thankYouScreen: { content: {}, settings: {} },
      questions: [],
      design: {},
    },
  };
}

beforeEach(() => {
  useFormStore.setState({
    formId: 1,
    form: makeForm(),
    addBlockDialogOpen: true,
    pendingInsert: null,
    selectedBlock: { id: "welcome", type: "welcome" },
  });
});

describe("AddBlockDialog", () => {
  it("shows the search placeholder", () => {
    render(<AddBlockDialog />);
    expect(screen.getByPlaceholderText(/search blocks/i)).toBeInTheDocument();
  });

  it("renders all field types", () => {
    render(<AddBlockDialog />);
    for (const field of FIELDS) {
      expect(screen.getByText(field.label)).toBeInTheDocument();
    }
  });

  it("does not render when closed", () => {
    useFormStore.setState({ addBlockDialogOpen: false });
    render(<AddBlockDialog />);
    expect(screen.queryByPlaceholderText(/search blocks/i)).not.toBeInTheDocument();
  });

  it("adds a question and closes dialog when a field type is selected (append mode)", async () => {
    const user = userEvent.setup();
    render(<AddBlockDialog />);
    await user.click(screen.getByText("Short text"));
    const { form, addBlockDialogOpen } = useFormStore.getState();
    expect(form.content.questions).toHaveLength(1);
    expect(form.content.questions[0].type).toBe("short_text");
    expect(addBlockDialogOpen).toBe(false);
  });

  it("inserts at the pendingInsert index and clears pendingInsert", async () => {
    useFormStore.setState({
      form: makeForm(),
      pendingInsert: 0,
    });
    const user = userEvent.setup();
    render(<AddBlockDialog />);
    await user.click(screen.getByText("Email field"));
    const { form, pendingInsert } = useFormStore.getState();
    expect(form.content.questions[0].type).toBe("email");
    expect(pendingInsert).toBeNull();
  });

  it("opens automatically when pendingInsert is set", () => {
    useFormStore.setState({ addBlockDialogOpen: false, pendingInsert: 2 });
    render(<AddBlockDialog />);
    expect(useFormStore.getState().addBlockDialogOpen).toBe(true);
  });

  it("clears pendingInsert when dialog is closed", async () => {
    useFormStore.setState({ pendingInsert: 1 });
    const user = userEvent.setup();
    render(<AddBlockDialog />);
    // Press Escape to close
    await user.keyboard("{Escape}");
    expect(useFormStore.getState().pendingInsert).toBeNull();
  });
});
