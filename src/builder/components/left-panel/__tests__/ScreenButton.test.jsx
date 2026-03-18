import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScreenButton from "../ScreenButton";
import { useFormStore } from "../../../store/useFormStore";

beforeEach(() => {
  useFormStore.setState({
    selectedBlock: { id: "welcome", type: "welcome" },
  });
});

describe("ScreenButton — welcome", () => {
  it("renders the title text", () => {
    render(<ScreenButton title="Welcome page" type="welcome" />);
    expect(screen.getByText("Welcome page")).toBeInTheDocument();
  });

  it("applies selected styles when this screen is selected", () => {
    useFormStore.setState({ selectedBlock: { id: "welcome", type: "welcome" } });
    render(<ScreenButton title="Welcome page" type="welcome" />);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border-dashed");
  });

  it("does not apply selected styles when another block is selected", () => {
    useFormStore.setState({ selectedBlock: { id: "thankYou", type: "thankYou" } });
    render(<ScreenButton title="Welcome page" type="welcome" />);
    const btn = screen.getByRole("button");
    expect(btn.className).not.toContain("border-dashed");
  });

  it("calls setSelectedBlock with correct shape when clicked", async () => {
    const user = userEvent.setup();
    render(<ScreenButton title="Welcome page" type="welcome" />);
    await user.click(screen.getByRole("button"));
    expect(useFormStore.getState().selectedBlock).toEqual({ id: "welcome", type: "welcome" });
  });
});

describe("ScreenButton — thankYou", () => {
  it("renders the title text", () => {
    render(<ScreenButton title="Thank you page" type="thankYou" />);
    expect(screen.getByText("Thank you page")).toBeInTheDocument();
  });

  it("is selected when thankYou is the selectedBlock", () => {
    useFormStore.setState({ selectedBlock: { id: "thankYou", type: "thankYou" } });
    render(<ScreenButton title="Thank you page" type="thankYou" />);
    expect(screen.getByRole("button").className).toContain("border-dashed");
  });

  it("sets selectedBlock to thankYou when clicked", async () => {
    useFormStore.setState({ selectedBlock: null });
    const user = userEvent.setup();
    render(<ScreenButton title="Thank you page" type="thankYou" />);
    await user.click(screen.getByRole("button"));
    expect(useFormStore.getState().selectedBlock).toEqual({ id: "thankYou", type: "thankYou" });
  });
});
