import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlockItemMenu from "../BlockItemMenu";
import { useFormStore } from "../../../store/useFormStore";

const QUESTION = {
  id: "q1",
  type: "short_text",
  content: { title: "Test question" },
  settings: { required: false },
};

function makeForm() {
  return {
    id: 1,
    title: "Test",
    content: {
      welcomeScreen: { content: {}, settings: {} },
      thankYouScreen: { content: {}, settings: {} },
      questions: [{ ...QUESTION }],
      design: {},
    },
  };
}

beforeEach(() => {
  useFormStore.setState({
    formId: 1,
    form: makeForm(),
    selectedBlock: { id: "q1", type: "question" },
  });
});

async function openMenu(user) {
  const trigger = screen.getByRole("button", { name: /open options/i });
  await user.click(trigger);
}

describe("BlockItemMenu", () => {
  it("renders the trigger button", () => {
    render(<BlockItemMenu question={QUESTION} />);
    expect(screen.getByRole("button", { name: /open options/i })).toBeInTheDocument();
  });

  it("shows Edit, Duplicate and Delete items after opening", async () => {
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("Edit selects the question block", async () => {
    useFormStore.setState({ selectedBlock: null });
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    await user.click(screen.getByText("Edit"));
    expect(useFormStore.getState().selectedBlock).toEqual({
      id: "q1",
      type: "question",
      questionType: "short_text",
    });
  });

  it("Duplicate adds a new question to the list", async () => {
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    await user.click(screen.getByText("Duplicate"));
    expect(useFormStore.getState().form.content.questions).toHaveLength(2);
  });

  it("Duplicate auto-selects the new question", async () => {
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    await user.click(screen.getByText("Duplicate"));
    const { selectedBlock, form } = useFormStore.getState();
    const dupeId = form.content.questions[1].id;
    expect(selectedBlock.id).toBe(dupeId);
  });

  it("Delete removes the question from the list", async () => {
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    await user.click(screen.getByText("Delete"));
    expect(useFormStore.getState().form.content.questions).toHaveLength(0);
  });

  it("Delete falls back selection to welcome screen", async () => {
    const user = userEvent.setup();
    render(<BlockItemMenu question={QUESTION} />);
    await openMenu(user);
    await user.click(screen.getByText("Delete"));
    expect(useFormStore.getState().selectedBlock).toEqual({ id: "welcome", type: "welcome" });
  });
});
