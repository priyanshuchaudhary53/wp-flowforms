import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useFormStore } from "../useFormStore";

function makeForm(overrides = {}) {
  return {
    id: 1,
    title: "Test Form",
    content: {
      welcomeScreen: { content: { title: "Welcome" }, settings: {} },
      thankYouScreen: { content: { title: "Thanks" }, settings: {} },
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
    loading: false,
    error: null,
    addBlockDialogOpen: false,
    designDrawerOpen: false,
    draftDesign: null,
    designDirty: false,
    saveStatus: "saved",
    selectedBlock: { id: "welcome", type: "welcome" },
    pendingInsert: null,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Selected block
// ═══════════════════════════════════════════════════════════════════════════════
describe("selectedBlock", () => {
  it("setSelectedBlock updates selectedBlock", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setSelectedBlock({ id: "abc", type: "question" }));
    expect(result.current.selectedBlock).toEqual({ id: "abc", type: "question" });
  });

  it("clearSelectedBlock sets selectedBlock to null", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.clearSelectedBlock());
    expect(result.current.selectedBlock).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pending insert
// ═══════════════════════════════════════════════════════════════════════════════
describe("pendingInsert", () => {
  it("setPendingInsert stores the index", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setPendingInsert(2));
    expect(result.current.pendingInsert).toBe(2);
  });

  it("clearPendingInsert resets to null", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => {
      result.current.setPendingInsert(3);
      result.current.clearPendingInsert();
    });
    expect(result.current.pendingInsert).toBeNull();
  });

  it("setPendingInsert works for index 0", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setPendingInsert(0));
    expect(result.current.pendingInsert).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// setDesignDrawerOpen
// ═══════════════════════════════════════════════════════════════════════════════
describe("setDesignDrawerOpen", () => {
  it("opening sets designDrawerOpen to true", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(true));
    expect(result.current.designDrawerOpen).toBe(true);
  });

  it("opening snapshots the committed design into draftDesign", () => {
    useFormStore.setState({ form: makeForm({ design: { bg_color: "#ff0000" } }) });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(true));
    expect(result.current.draftDesign).toEqual({ bg_color: "#ff0000" });
  });

  it("opening with no committed design starts with an empty draft object", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(true));
    expect(result.current.draftDesign).toEqual({});
  });

  it("opening resets designDirty to false", () => {
    useFormStore.setState({ designDirty: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(true));
    expect(result.current.designDirty).toBe(false);
  });

  it("closing sets designDrawerOpen to false", () => {
    useFormStore.setState({ designDrawerOpen: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(false));
    expect(result.current.designDrawerOpen).toBe(false);
  });

  it("closing clears designDirty", () => {
    useFormStore.setState({ designDrawerOpen: true, designDirty: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.setDesignDrawerOpen(false));
    expect(result.current.designDirty).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateDesign / setDraftDesign
// ═══════════════════════════════════════════════════════════════════════════════
describe("updateDesign", () => {
  beforeEach(() => {
    useFormStore.setState({ designDrawerOpen: true, draftDesign: {} });
  });

  it("writes the value into draftDesign", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateDesign("bg_color", "#123456"));
    expect(result.current.draftDesign.bg_color).toBe("#123456");
  });

  it("marks designDirty true when value differs from committed design", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateDesign("bg_color", "#123456"));
    expect(result.current.designDirty).toBe(true);
  });

  it("does NOT mark dirty when value matches committed design", () => {
    useFormStore.setState({
      form: makeForm({ design: { bg_color: "#ffffff" } }),
      draftDesign: { bg_color: "#ffffff" },
    });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateDesign("bg_color", "#ffffff"));
    expect(result.current.designDirty).toBe(false);
  });

  it("can update multiple keys independently", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => {
      result.current.updateDesign("bg_color", "#aaa");
      result.current.updateDesign("title_color", "#bbb");
    });
    expect(result.current.draftDesign.bg_color).toBe("#aaa");
    expect(result.current.draftDesign.title_color).toBe("#bbb");
  });

  it("setting a key to null still updates draftDesign", () => {
    useFormStore.setState({ draftDesign: { bg_image: { url: "x.jpg" } } });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateDesign("bg_image", null));
    expect(result.current.draftDesign.bg_image).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// commitDesign
// ═══════════════════════════════════════════════════════════════════════════════
describe("commitDesign", () => {
  it("copies draftDesign into form.content.design", () => {
    useFormStore.setState({ draftDesign: { bg_color: "#ff0000" }, designDirty: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.commitDesign());
    expect(result.current.form.content.design.bg_color).toBe("#ff0000");
  });

  it("clears designDirty after commit", () => {
    useFormStore.setState({ draftDesign: { bg_color: "#ff0000" }, designDirty: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.commitDesign());
    expect(result.current.designDirty).toBe(false);
  });

  it("sets saveStatus to unsaved", () => {
    useFormStore.setState({ draftDesign: { bg_color: "#ff0000" } });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.commitDesign());
    expect(result.current.saveStatus).toBe("unsaved");
  });

  it("does nothing when form is null", () => {
    useFormStore.setState({ form: null, draftDesign: { bg_color: "#ff0000" } });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.commitDesign());
    expect(result.current.form).toBeNull();
  });

  it("does nothing when draftDesign is null", () => {
    useFormStore.setState({ draftDesign: null });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.commitDesign());
    expect(result.current.form.content.design).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// discardDesign
// ═══════════════════════════════════════════════════════════════════════════════
describe("discardDesign", () => {
  it("closes the drawer immediately", () => {
    useFormStore.setState({ designDrawerOpen: true, designDirty: true, draftDesign: { bg_color: "#f00" } });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.discardDesign());
    expect(result.current.designDrawerOpen).toBe(false);
  });

  it("clears designDirty immediately", () => {
    useFormStore.setState({ designDrawerOpen: true, designDirty: true });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.discardDesign());
    expect(result.current.designDirty).toBe(false);
  });

  it("does not touch the committed form design", () => {
    useFormStore.setState({
      form: makeForm({ design: { bg_color: "#committed" } }),
      draftDesign: { bg_color: "#draft" },
      designDirty: true,
    });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.discardDesign());
    expect(result.current.form.content.design.bg_color).toBe("#committed");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// addQuestion
// ═══════════════════════════════════════════════════════════════════════════════
describe("addQuestion", () => {
  it("appends a question with the correct type", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("short_text"));
    expect(result.current.form.content.questions[0].type).toBe("short_text");
  });

  it("starts with a blank title", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("email"));
    expect(result.current.form.content.questions[0].content.title).toBe("");
  });

  it("auto-selects the new question", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("rating"));
    const { selectedBlock, form } = result.current;
    expect(selectedBlock.type).toBe("question");
    expect(selectedBlock.id).toBe(form.content.questions[0].id);
    expect(selectedBlock.questionType).toBe("rating");
  });

  it("marks saveStatus as unsaved", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("short_text"));
    expect(result.current.saveStatus).toBe("unsaved");
  });

  it("each question gets a unique id", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => {
      result.current.addQuestion("short_text");
      result.current.addQuestion("email");
    });
    const ids = result.current.form.content.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("generates content and settings objects from blockSettings schema", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("short_text"));
    const q = result.current.form.content.questions[0];
    expect(q.content).toBeTypeOf("object");
    expect(q.settings).toBeTypeOf("object");
  });

  it("appends to an existing list", () => {
    useFormStore.setState({
      form: makeForm({
        questions: [{ id: "existing", type: "email", content: { title: "Q1" }, settings: {} }],
      }),
    });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.addQuestion("rating"));
    expect(result.current.form.content.questions).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// insertQuestion
// ═══════════════════════════════════════════════════════════════════════════════
describe("insertQuestion", () => {
  beforeEach(() => {
    useFormStore.setState({
      form: makeForm({
        questions: [
          { id: "q1", type: "short_text", content: { title: "Q1" }, settings: {} },
          { id: "q2", type: "email", content: { title: "Q2" }, settings: {} },
        ],
      }),
    });
  });

  it("inserts at the given index", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.insertQuestion("number", 1));
    const qs = result.current.form.content.questions;
    expect(qs).toHaveLength(3);
    expect(qs[1].type).toBe("number");
  });

  it("shifts existing questions down correctly", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.insertQuestion("number", 1));
    const qs = result.current.form.content.questions;
    expect(qs[0].id).toBe("q1");
    expect(qs[2].id).toBe("q2");
  });

  it("inserts at index 0 correctly", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.insertQuestion("yes_no", 0));
    expect(result.current.form.content.questions[0].type).toBe("yes_no");
  });

  it("clears pendingInsert after inserting", () => {
    useFormStore.setState({ pendingInsert: 1 });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.insertQuestion("email", 1));
    expect(result.current.pendingInsert).toBeNull();
  });

  it("auto-selects the inserted question", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.insertQuestion("rating", 0));
    expect(result.current.selectedBlock.type).toBe("question");
    expect(result.current.selectedBlock.questionType).toBe("rating");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// deleteQuestion
// ═══════════════════════════════════════════════════════════════════════════════
describe("deleteQuestion", () => {
  beforeEach(() => {
    useFormStore.setState({
      form: makeForm({
        questions: [
          { id: "q1", type: "short_text", content: { title: "Q1" }, settings: {} },
          { id: "q2", type: "email", content: { title: "Q2" }, settings: {} },
        ],
      }),
      selectedBlock: { id: "q1", type: "question" },
    });
  });

  it("removes the question from the list", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.deleteQuestion("q1"));
    expect(result.current.form.content.questions).toHaveLength(1);
    expect(result.current.form.content.questions[0].id).toBe("q2");
  });

  it("falls back to welcome when the deleted question was selected", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.deleteQuestion("q1"));
    expect(result.current.selectedBlock).toEqual({ id: "welcome", type: "welcome" });
  });

  it("keeps selection unchanged when a different question is deleted", () => {
    useFormStore.setState({ selectedBlock: { id: "q2", type: "question" } });
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.deleteQuestion("q1"));
    expect(result.current.selectedBlock.id).toBe("q2");
  });

  it("marks saveStatus as unsaved", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.deleteQuestion("q1"));
    expect(result.current.saveStatus).toBe("unsaved");
  });

  it("is a no-op for a nonexistent id", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.deleteQuestion("nonexistent"));
    expect(result.current.form.content.questions).toHaveLength(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// duplicateQuestion
// ═══════════════════════════════════════════════════════════════════════════════
describe("duplicateQuestion", () => {
  beforeEach(() => {
    useFormStore.setState({
      form: makeForm({
        questions: [
          { id: "q1", type: "short_text", content: { title: "Original" }, settings: { required: true } },
        ],
      }),
    });
  });

  it("inserts a copy immediately after the source", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("q1"));
    expect(result.current.form.content.questions).toHaveLength(2);
    expect(result.current.form.content.questions[0].id).toBe("q1");
  });

  it("duplicate has the same content as the source", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("q1"));
    expect(result.current.form.content.questions[1].content.title).toBe("Original");
  });

  it("duplicate gets a different id", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("q1"));
    const [orig, dupe] = result.current.form.content.questions;
    expect(dupe.id).not.toBe(orig.id);
  });

  it("deep-clones so changing duplicate does not affect source", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("q1"));
    const dupeId = result.current.form.content.questions[1].id;
    act(() =>
      result.current.updateBlockField(dupeId, "question", "settings", "required", false)
    );
    expect(result.current.form.content.questions[0].settings.required).toBe(true);
  });

  it("auto-selects the duplicate", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("q1"));
    const dupeId = result.current.form.content.questions[1].id;
    expect(result.current.selectedBlock.id).toBe(dupeId);
  });

  it("is a no-op when id does not exist", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.duplicateQuestion("nonexistent"));
    expect(result.current.form.content.questions).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// reorderQuestions
// ═══════════════════════════════════════════════════════════════════════════════
describe("reorderQuestions", () => {
  it("replaces questions array with the new order", () => {
    useFormStore.setState({
      form: makeForm({
        questions: [
          { id: "q1", type: "short_text", content: { title: "A" }, settings: {} },
          { id: "q2", type: "email", content: { title: "B" }, settings: {} },
        ],
      }),
    });
    const { result } = renderHook(() => useFormStore());
    const reversed = [...result.current.form.content.questions].reverse();
    act(() => result.current.reorderQuestions(reversed));
    expect(result.current.form.content.questions[0].id).toBe("q2");
    expect(result.current.form.content.questions[1].id).toBe("q1");
  });

  it("marks saveStatus as unsaved", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.reorderQuestions([]));
    expect(result.current.saveStatus).toBe("unsaved");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// updateBlockField
// ═══════════════════════════════════════════════════════════════════════════════
describe("updateBlockField", () => {
  beforeEach(() => {
    useFormStore.setState({
      form: makeForm({
        questions: [
          { id: "q1", type: "short_text", content: { title: "" }, settings: { required: false } },
          { id: "q2", type: "email", content: { title: "Q2" }, settings: {} },
        ],
      }),
    });
  });

  it("updates a content field on a question", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateBlockField("q1", "question", "content", "title", "Hello?"));
    expect(result.current.form.content.questions[0].content.title).toBe("Hello?");
  });

  it("updates a settings field on a question", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateBlockField("q1", "question", "settings", "required", true));
    expect(result.current.form.content.questions[0].settings.required).toBe(true);
  });

  it("does not affect other questions", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateBlockField("q1", "question", "content", "title", "Updated"));
    expect(result.current.form.content.questions[1].content.title).toBe("Q2");
  });

  it("updates a content field on the welcome screen", () => {
    const { result } = renderHook(() => useFormStore());
    act(() =>
      result.current.updateBlockField("welcome", "welcome", "content", "title", "New Title")
    );
    expect(result.current.form.content.welcomeScreen.content.title).toBe("New Title");
  });

  it("updates a settings field on the welcome screen", () => {
    const { result } = renderHook(() => useFormStore());
    act(() =>
      result.current.updateBlockField("welcome", "welcome", "settings", "layout", "left")
    );
    expect(result.current.form.content.welcomeScreen.settings.layout).toBe("left");
  });

  it("updates a content field on the thankYou screen", () => {
    const { result } = renderHook(() => useFormStore());
    act(() =>
      result.current.updateBlockField("thankYou", "thankYou", "content", "title", "Bye!")
    );
    expect(result.current.form.content.thankYouScreen.content.title).toBe("Bye!");
  });

  it("marks saveStatus as unsaved", () => {
    const { result } = renderHook(() => useFormStore());
    act(() => result.current.updateBlockField("q1", "question", "content", "title", "x"));
    expect(result.current.saveStatus).toBe("unsaved");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// _persistForm
// ═══════════════════════════════════════════════════════════════════════════════
describe("_persistForm", () => {
  it("calls fetch with PATCH to the correct URL", async () => {
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost/wp-json/flowforms/v1/forms/1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("sends form_data in the request body", async () => {
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body).toHaveProperty("form_data");
  });

  it("sends the WP nonce header", async () => {
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(fetch.mock.calls[0][1].headers["X-WP-Nonce"]).toBe("test-nonce");
  });

  it("sets saveStatus to saved on success", async () => {
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(result.current.saveStatus).toBe("saved");
  });

  it("sets saveStatus to unsaved on API failure", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(result.current.saveStatus).toBe("unsaved");
  });

  it("does nothing when formId is 0", async () => {
    useFormStore.setState({ formId: 0 });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does nothing when form is null", async () => {
    useFormStore.setState({ form: null });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current._persistForm());
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// fetchForm
// ═══════════════════════════════════════════════════════════════════════════════
describe("fetchForm", () => {
  it("stores the returned form in state", async () => {
    const formData = { ...makeForm(), title: "Fetched Form" };
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(formData) });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(result.current.form.title).toBe("Fetched Form");
  });

  it("sets saveStatus to saved after fetch", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeForm()) });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(result.current.saveStatus).toBe("saved");
  });

  it("sets loading to false after fetch completes", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(makeForm()) });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(result.current.loading).toBe(false);
  });

  it("sets error on API failure", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(result.current.error).toBeTruthy();
  });

  it("still sets loading to false after failure", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(result.current.loading).toBe(false);
  });

  it("does nothing when formId is 0", async () => {
    useFormStore.setState({ formId: 0 });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.fetchForm());
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// renameForm
// ═══════════════════════════════════════════════════════════════════════════════
describe("renameForm", () => {
  it("updates form.title in state on success", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const { result } = renderHook(() => useFormStore());
    await act(async () => result.current.renameForm("New Name"));
    expect(result.current.form.title).toBe("New Name");
  });

  it("throws when the API returns an error", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Bad request" }),
    });
    const { result } = renderHook(() => useFormStore());
    await expect(result.current.renameForm("Bad")).rejects.toThrow("Bad request");
  });

  it("throws with a fallback message when API body has no message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });
    const { result } = renderHook(() => useFormStore());
    await expect(result.current.renameForm("Bad")).rejects.toThrow();
  });
});
