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
        const defaultValue =
          field.type === "options" ? field.default ?? [] : field.default ?? "";
        if (field.namespace === "content") {
          content[field.key] = defaultValue;
        } else {
          settings[field.key] = defaultValue;
        }
      }
    }
  }

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
  previewOpen: false,
  draftDesign: null,
  designDirty: false,

  // Whether the server currently has an unpublished draft for this form.
  hasDraft: false,
  // Whether a published version exists (false for brand-new forms).
  hasPublished: false,

  // "saved" | "unsaved" | "saving"
  saveStatus: "saved",

  // shape: { id: string, type: "welcome" | "thankYou" | "question", questionType?: string }
  selectedBlock: { id: "welcome", type: "welcome" },

  pendingInsert: null,

  setPreviewOpen: (open) => set({ previewOpen: open }),
  setSelectedBlock: (block) => set({ selectedBlock: block }),
  clearSelectedBlock: () => set({ selectedBlock: null }),
  setPendingInsert: (index) => set({ pendingInsert: index }),
  clearPendingInsert: () => set({ pendingInsert: null }),

  setFormId: (id) => set({ formId: id }),
  setForm: (form) => set({ form }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setAddBlockDialogOpen: (addBlockDialogOpen) => set({ addBlockDialogOpen }),

  setDesignDrawerOpen: (open) => {
    if (open) {
      const committedDesign = get().form?.content?.design ?? {};
      set({
        designDrawerOpen: true,
        draftDesign: { ...committedDesign },
        designDirty: false,
      });
    } else {
      set({ designDrawerOpen: false, designDirty: false });
      setTimeout(() => set({ draftDesign: null }), 300);
    }
  },

  // ── Draft design actions ──────────────────────────────────────────────────

  setDraftDesign: (key, value) => {
    set((state) => {
      const newDraft   = { ...(state.draftDesign ?? {}), [key]: value };
      const committed  = state.form?.content?.design ?? {};

      // A key is dirty only when its value differs from what is committed.
      // Keys that exist in newDraft but not in committed are dirty only if
      // their value is non-empty — setting a field to "" when it was never
      // set is not a change worth blocking close for.
      const dirty = Object.keys(newDraft).some((k) => {
        const committedVal = committed[k];
        const draftVal     = newDraft[k];
        // Both absent/empty → not dirty
        if (committedVal === undefined && (draftVal === "" || draftVal === null || draftVal === undefined)) {
          return false;
        }
        return draftVal !== committedVal;
      });

      return { draftDesign: newDraft, designDirty: dirty };
    });
  },

  commitDesign: () => {
    const { form, draftDesign } = get();
    if (!form || !draftDesign) return;
    set((state) => ({
      form: {
        ...state.form,
        content: { ...state.form.content, design: { ...draftDesign } },
      },
      designDirty: false,
    }));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => get()._persistDesign(), 800);
  },

  discardDesign: () => {
    set({ designDrawerOpen: false, designDirty: false });
    setTimeout(() => set({ draftDesign: null }), 300);
  },

  // ── Update a single field for the selected block ─────────────────────────
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

  updateDesign: (key, value) => {
    get().setDraftDesign(key, value);
  },

  // ── Add a new question block ──────────────────────────────────────────────
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

  deleteQuestion: (questionId) => {
    set((state) => {
      const form = state.form;
      if (!form) return {};

      const questions = (form.content?.questions ?? []).filter(
        (q) => q.id !== questionId,
      );

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

  // ── Persist form content to REST API (always writes to draft slot) ────────
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

      // After first auto-save, a draft now exists on the server.
      set({ saveStatus: "saved", hasDraft: true });
    } catch (err) {
      console.error("Auto-save failed:", err);
      set({ saveStatus: "unsaved" });
    }
  },

  // ── Persist design directly to published slot ─────────────────────────────
  // Design changes bypass the draft system — they go live immediately on
  // the published version. The PHP endpoint also mirrors into the draft slot
  // if one exists, so the builder canvas stays in sync.
  _persistDesign: async () => {
    const { formId, form } = get();
    if (!formId || !form) return;

    const design = form.content?.design ?? {};

    try {
      const res = await fetch(
        `${formflowData.apiUrl}/forms/${formId}/design`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": formflowData.nonce,
          },
          body: JSON.stringify({ design }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `API Error: ${res.status}`);
      }
    } catch (err) {
      console.error("Design save failed:", err);
    }
  },

  // ── Publish: promote draft → published, clear draft ───────────────────────
  publishForm: async () => {
    const { formId } = get();
    if (!formId) return;

    try {
      const res = await fetch(
        `${formflowData.apiUrl}/forms/${formId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": formflowData.nonce,
          },
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `API Error: ${res.status}`);
      }

      // Draft is gone — button flips to "Published" state.
      set({ hasDraft: false, hasPublished: true });
    } catch (err) {
      console.error("Publish failed:", err);
      throw err;
    }
  },

  // ── Revert: discard draft, reload published content into builder ──────────
  revertForm: async () => {
    const { formId } = get();
    if (!formId) return;

    try {
      const res = await fetch(
        `${formflowData.apiUrl}/forms/${formId}/revert`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": formflowData.nonce,
          },
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `API Error: ${res.status}`);
      }

      const data = await res.json();

      // Replace builder content with the published version and clear draft flag.
      set((state) => ({
        form: { ...state.form, content: data.content },
        hasDraft: false,
        saveStatus: "saved",
        selectedBlock: { id: "welcome", type: "welcome" },
      }));
    } catch (err) {
      console.error("Revert failed:", err);
      throw err;
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
      // `has_draft` from the API tells us whether a draft slot exists.
      set({ form: data, hasDraft: data.has_draft ?? false, hasPublished: data.has_published ?? false, saveStatus: "saved" });
    } catch (err) {
      console.error("Failed to load form:", err);
      set({ error: "Failed to load form." });
    } finally {
      set({ loading: false });
    }
  },
}));
