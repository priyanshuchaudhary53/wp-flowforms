import { create } from "zustand";
import BLOCK_SETTINGS from "../components/right-panel/blockSettings";

// ── Debounce helper ────────────────────────────────────────────────────────
let saveTimer = null;

// ── Build default content/settings from blockSettings schema ───────────────
function buildDefaultQuestion(fieldType) {
  const schema = BLOCK_SETTINGS[fieldType];
  const content = {};
  const settings = {};

  if (schema) {
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.namespace === "content") {
          content[field.key] = field.default ?? "";
        } else {
          settings[field.key] = field.default ?? "";
        }
      }
    }
  }

  // title is always the user-editable question text — start blank
  content.title = "";

  return {
    id: crypto.randomUUID(),
    type: fieldType,
    content,
    settings,
  };
}

export const useFormStore = create((set, get) => ({
  formId: Number(formflowData.formId) || 0,
  form: null,
  loading: false,
  error: null,
  addBlockDialogOpen: false,
  designDrawerOpen: false,
  draftDesign: null, // holds in-progress design changes while drawer is open
  designDirty: false, // true when draftDesign differs from committed design

  // "saved" | "unsaved" | "saving"
  saveStatus: "saved",

  // shape: { id: string, type: "welcome" | "thankYou" | "question", questionType?: string }
  selectedBlock: { id: "welcome", type: "welcome" },

  // When set, AddBlockDialog inserts at this index instead of appending.
  // null = append to end (normal add), number = insert before that index.
  pendingInsert: null,

  setSelectedBlock: (block) => set({ selectedBlock: block }),
  clearSelectedBlock: () => set({ selectedBlock: null }),
  setPendingInsert: (index) => set({ pendingInsert: index }),
  clearPendingInsert: () => set({ pendingInsert: null }),

  setFormId: (id) => set({ formId: id }),
  setForm: (form) => set({ form }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setAddBlockDialogOpen: (addBlockDialogOpen) => set({ addBlockDialogOpen }),
  // Opening the drawer snapshots the current committed design into draftDesign.
  // Closing via this setter (programmatic) does NOT discard — use discardDesign for that.
  setDesignDrawerOpen: (open) => {
    if (open) {
      const committedDesign = get().form?.content?.design ?? {};
      set({
        designDrawerOpen: true,
        draftDesign: { ...committedDesign },
        designDirty: false,
      });
    } else {
      // Close the drawer immediately but delay clearing draftDesign until after
      // the Sheet's exit animation (~200ms) so the canvas doesn't flash back to
      // the committed design while the panel is still animating out.
      set({ designDrawerOpen: false, designDirty: false });
      setTimeout(() => set({ draftDesign: null }), 300);
    }
  },

  // ── Draft design actions ──────────────────────────────────────────────────

  // Write one key into draftDesign (does NOT persist or touch committed design).
  setDraftDesign: (key, value) => {
    set((state) => {
      const newDraft = { ...(state.draftDesign ?? {}), [key]: value };
      // Re-derive dirty by comparing every draft key against committed design.
      // This way clicking an already-active option never marks the drawer dirty.
      const committed = state.form?.content?.design ?? {};
      const dirty = Object.keys(newDraft).some(
        (k) => newDraft[k] !== (committed[k] ?? ""),
      );
      return { draftDesign: newDraft, designDirty: dirty };
    });
  },

  // Copy draftDesign over committed design and persist to API.
  commitDesign: () => {
    const { form, draftDesign } = get();
    if (!form || !draftDesign) return;
    set((state) => ({
      form: {
        ...state.form,
        content: { ...state.form.content, design: { ...draftDesign } },
      },
      designDirty: false,
      saveStatus: "unsaved",
    }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // Throw away draftDesign and close the drawer; canvas reverts to committed design.
  discardDesign: () => {
    // Close and clear dirty flag immediately; delay nulling draftDesign so the
    // canvas doesn't flash during the Sheet's exit animation.
    set({ designDrawerOpen: false, designDirty: false });
    setTimeout(() => set({ draftDesign: null }), 300);
  },

  // ── Update a single field for the selected block ─────────────────────────
  // `namespace` is "content" or "settings" — matches the field's namespace
  // in blockSettings.js and the sub-object in the stored block data.
  updateBlockField: (blockId, blockType, namespace, key, value) => {
    set((state) => {
      const form = state.form;
      if (!form) return {};

      const content = { ...form.content };

      if (blockType === "welcome") {
        content.welcomeScreen = {
          ...content.welcomeScreen,
          [namespace]: {
            ...(content.welcomeScreen?.[namespace] ?? {}),
            [key]: value,
          },
        };
      } else if (blockType === "thankYou") {
        content.thankYouScreen = {
          ...content.thankYouScreen,
          [namespace]: {
            ...(content.thankYouScreen?.[namespace] ?? {}),
            [key]: value,
          },
        };
      } else {
        content.questions = (content.questions ?? []).map((q) =>
          q.id === blockId
            ? {
                ...q,
                [namespace]: {
                  ...(q[namespace] ?? {}),
                  [key]: value,
                },
              }
            : q,
        );
      }

      return {
        form: { ...form, content },
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Update a single design property ──────────────────────────────────────
  // While the design drawer is open, writes only to draftDesign so the canvas
  // can preview the change without persisting. Commit/discard is handled
  // explicitly by the drawer footer buttons.
  updateDesign: (key, value) => {
    get().setDraftDesign(key, value);
  },

  // ── Add a new question block ──────────────────────────────────────────────
  // Builds a fully-defaulted question from blockSettings, appends it to
  // the questions array, auto-selects it, then triggers a debounced save.
  addQuestion: (fieldType) => {
    const question = buildDefaultQuestion(fieldType);

    set((state) => {
      const form = state.form;
      if (!form) return {};

      return {
        form: {
          ...form,
          content: {
            ...form.content,
            questions: [...(form.content?.questions ?? []), question],
          },
        },
        selectedBlock: {
          id: question.id,
          type: "question",
          questionType: question.type,
        },
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Insert a new question at a specific index ─────────────────────────────
  // Used by the "add before / after" canvas buttons. atIndex is the position
  // in the array to splice into; auto-selects the new question and saves.
  insertQuestion: (fieldType, atIndex) => {
    const question = buildDefaultQuestion(fieldType);

    set((state) => {
      const form = state.form;
      if (!form) return {};

      const questions = [...(form.content?.questions ?? [])];
      questions.splice(atIndex, 0, question);

      return {
        form: {
          ...form,
          content: { ...form.content, questions },
        },
        selectedBlock: {
          id: question.id,
          type: "question",
          questionType: question.type,
        },
        pendingInsert: null,
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Reorder questions after drag-and-drop ────────────────────────────────
  // Receives the new ordered array of questions, updates local state
  // immediately, then debounces a save.
  reorderQuestions: (orderedQuestions) => {
    set((state) => {
      const form = state.form;
      if (!form) return {};
      return {
        form: {
          ...form,
          content: {
            ...form.content,
            questions: orderedQuestions,
          },
        },
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Delete a question by id ──────────────────────────────────────────────────
  deleteQuestion: (questionId) => {
    set((state) => {
      const form = state.form;
      if (!form) return {};

      const questions = (form.content?.questions ?? []).filter(
        (q) => q.id !== questionId,
      );

      // If the deleted question was selected, fall back to welcome screen
      const selectedBlock = state.selectedBlock;
      const nextSelected =
        selectedBlock?.type === "question" && selectedBlock?.id === questionId
          ? { id: "welcome", type: "welcome" }
          : selectedBlock;

      return {
        form: { ...form, content: { ...form.content, questions } },
        selectedBlock: nextSelected,
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Duplicate a question by id ────────────────────────────────────────────
  // Inserts a deep copy with a fresh id immediately after the source question,
  // then auto-selects the duplicate.
  duplicateQuestion: (questionId) => {
    set((state) => {
      const form = state.form;
      if (!form) return {};

      const questions = form.content?.questions ?? [];
      const index = questions.findIndex((q) => q.id === questionId);
      if (index === -1) return {};

      const source = questions[index];
      const duplicate = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
      };

      const next = [...questions];
      next.splice(index + 1, 0, duplicate);

      return {
        form: { ...form, content: { ...form.content, questions: next } },
        selectedBlock: {
          id: duplicate.id,
          type: "question",
          questionType: duplicate.type,
        },
        saveStatus: "unsaved",
      };
    });

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistForm(), 800);
  },

  // ── Persist form content to REST API ─────────────────────────────────────
  _persistForm: async () => {
    const { formId, form } = get();
    if (!formId || !form) return;

    set({ saveStatus: "saving" });

    try {
      const res = await fetch(`${formflowData.apiUrl}/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": formflowData.nonce,
        },
        body: JSON.stringify({ form_data: form.content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `API Error: ${res.status}`);
      }

      set({ saveStatus: "saved" });
    } catch (err) {
      console.error("Auto-save failed:", err);
      set({ saveStatus: "unsaved" });
    }
  },

  // ── Rename form ───────────────────────────────────────────────────────────
  renameForm: async (newName) => {
    const { formId } = get();
    const res = await fetch(`${formflowData.apiUrl}/forms/${formId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": formflowData.nonce,
      },
      body: JSON.stringify({ form_name: newName }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || `API Error: ${res.status}`);
    }
    set((state) => ({ form: { ...state.form, title: newName } }));
  },

  // ── Fetch form ────────────────────────────────────────────────────────────
  fetchForm: async () => {
    const { formId } = get();
    if (!formId) {
      set({ loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${formflowData.apiUrl}/forms/${formId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": formflowData.nonce,
        },
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      set({ form: data, saveStatus: "saved" });
    } catch (err) {
      console.error("Failed to load form:", err);
      set({ error: "Failed to load form." });
    } finally {
      set({ loading: false });
    }
  },
}));
