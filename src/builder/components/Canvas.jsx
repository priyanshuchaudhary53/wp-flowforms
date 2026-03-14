import { StarIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import DESIGN_SETTINGS from "./design/designSettings";
import { useEffect } from "react";

// Inject Google Font <link> into document head (deduplicated)
function loadGoogleFont(fontName) {
  if (!fontName) return;
  const id = `gf-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fontName,
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// ── Screen previews ──────────────────────────────────────────────────────────

function WelcomePreview({ screen, design }) {
  const c = screen?.content ?? {};
  const s = screen?.settings ?? {};

  let alignment = "center";

  if (s.layout !== "default") {
    alignment = s.layout;
  } else {
    alignment = design.alignment;
  }

  return (
    <div
      className={[
        "flex flex-col justify-center",
        alignment === "center" ? "items-center" : "items-start",
        "h-full max-w-xl mx-auto gap-6 text-center px-8",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col",
          alignment === "center"
            ? "items-center text-center"
            : "items-start text-start",
          "gap-y-3 max-w-md",
        ].join(" ")}
      >
        <h1 className="text-3xl font-bold text-(--title-color)">
          {c.title || "Welcome!"}
        </h1>
        {c.description && (
          <p className="text-sm leading-relaxed text-(--desc-color)">
            {c.description}
          </p>
        )}
      </div>
      <button className="px-6 py-2.5 text-white text-sm font-medium transition-colors btn-primary">
        {c.buttonLabel || "Start"}
      </button>
    </div>
  );
}

function ThankYouPreview({ screen, design }) {
  const c = screen?.content ?? {};
  const s = screen?.settings ?? {};

  let alignment = "center";

  if (s.layout !== "default") {
    alignment = s.layout;
  } else {
    alignment = design.alignment;
  }

  return (
    <div
      className={[
        "flex flex-col justify-center",
        alignment === "center" ? "items-center" : "items-start",
        "h-full max-w-xl mx-auto gap-6 text-center px-8",
      ].join(" ")}
    >
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div
        className={[
          "flex flex-col",
          alignment === "center"
            ? "items-center text-center"
            : "items-start text-start",
          "gap-y-3 max-w-md",
        ].join(" ")}
      >
        <h1 className="text-3xl font-bold text-(--title-color)">
          {c.title || "Thank you!"}
        </h1>
        {c.description && (
          <p className="text-sm leading-relaxed text-(--desc-color)">
            {c.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Question preview ─────────────────────────────────────────────────────────

function QuestionPreview({ question, design }) {
  const c = question?.content ?? {};
  const alignment = design.alignment ?? "center";

  return (
    <div
      className={[
        "flex flex-col justify-center",
        alignment === "center" ? "items-center" : "items-start",
        "h-full max-w-xl mx-auto px-8 gap-5",
      ].join(" ")}
    >
      <div
        className={[
          "flex flex-col",
          alignment === "center"
            ? "items-center text-center"
            : "items-start text-start",
          "gap-y-2",
        ].join(" ")}
      >
        <h2 className="text-xl font-semibold text-(--title-color)">
          {c.title || "Untitled question"}
        </h2>
        {c.description && (
          <p className="text-sm text-(--desc-color)">{c.description}</p>
        )}
      </div>

      <QuestionInputMockup question={question} design={design} />

      <div className="flex items-center gap-3 mt-2">
        <button className="px-5 py-2 text-sm font-medium text-white transition-colors btn-primary">
          {c.buttonLabel || "OK"}
        </button>
        <span className="text-xs text-(--hint-color)">press Enter ↵</span>
      </div>
    </div>
  );
}

function QuestionInputMockup({ question, design }) {
  const type = question?.type;
  const c = question?.content ?? {};
  const s = question?.settings ?? {};
  const alignment = design.alignment ?? "center";

  if (type === "short_text") {
    return (
      <input
        readOnly
        placeholder={s.placeholder || "Your answer here..."}
        className="w-full border-b bg-transparent py-2 text-sm outline-none border-(--answer-color) placeholder:text-(--answer-color)/50"
      />
    );
  }
  if (type === "long_text") {
    return (
      <textarea
        readOnly
        rows={s.rows || 4}
        placeholder={s.placeholder || "Your answer here..."}
        className="w-full border-b bg-transparent py-2 text-sm outline-none resize-none border-(--answer-color) placeholder:text-(--answer-color)/50"
      />
    );
  }
  if (type === "email") {
    return (
      <input
        readOnly
        type="email"
        placeholder={s.placeholder || "name@example.com"}
        className="w-full border-b bg-transparent py-2 text-sm outline-none border-(--answer-color) placeholder:text-(--answer-color)/50"
      />
    );
  }
  if (type === "number") {
    return (
      <div className="flex w-full items-center gap-1 border-b py-2 border-(--answer-color)">
        {c.prefix && (
          <span className="text-sm text-(--answer-color)">{c.prefix}</span>
        )}
        <input
          readOnly
          type="number"
          placeholder={s.placeholder || "0"}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-(--answer-color)/50"
        />
        {c.suffix && (
          <span className="text-sm text-(--answer-color)">{c.suffix}</span>
        )}
      </div>
    );
  }
  if (type === "multiple_choice") {
    return (
      <div
        className={[
          s.layout === "vertical" ? "flex flex-wrap" : "grid",
          "w-full gap-2",
          s.layout === "grid_2" && "grid-cols-2",
          alignment === "center" ? "justify-center" : "justify-start",
        ].join(" ")}
      >
        {["Option A", "Option B", "Option C"].map((opt) => (
          <label
            key={opt}
            className="choice-item flex items-center gap-3 p-2.5 pr-4 border cursor-pointer transition-[background-color] hover:bg-(--answer-color)/10 text-sm text-(--answer-color) border-(--answer-color)"
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  if (type === "checkboxes") {
    return (
      <div
        className={[
          s.layout === "vertical" ? "flex flex-wrap" : "grid",
          "w-full gap-2",
          s.layout === "grid_2" && "grid-cols-2",
          alignment === "center" ? "justify-center" : "justify-start",
        ].join(" ")}
      >
        {["Option A", "Option B", "Option C"].map((opt) => (
          <label
            key={opt}
            className="choice-item flex items-center gap-3 p-2.5 pr-4 border cursor-pointer transition-[background-color] hover:bg-(--answer-color)/10 text-sm text-(--answer-color) border-(--answer-color)"
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  if (type === "rating") {
    let steps = s.steps || 5;
    if (steps > 10) steps = 10;
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          {Array.from({ length: steps }).map((_, i) => (
            <button key={i} style={{ color: `var(--star-color)` }}>
              <StarIcon width={40} widths={40} />
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (type === "yes_no") {
    return (
      <div className="flex gap-3">
        <button className="choice-item flex items-center gap-2 px-5 py-2.5 border text-sm transition-[background-color] text-(--answer-color) border-(--answer-color) hover:bg-(--answer-color)/10">
          {c.yesLabel || "Yes"}
        </button>
        <button className="choice-item flex items-center gap-2 px-5 py-2.5 border text-sm transition-[background-color] text-(--answer-color) border-(--answer-color) hover:bg-(--answer-color)/10">
          {c.noLabel || "No"}
        </button>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-400 italic">
      No preview available for this block type.
    </p>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-gray-400">
      <svg
        className="w-10 h-10 opacity-30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 15l-6-6m0 0l6-6m-6 6h12"
        />
      </svg>
      <p className="text-sm">Select a block on the left to preview it here</p>
    </div>
  );
}

function InsertButton({ position, onClick }) {
  return (
    <button
      onClick={onClick}
      title={
        position === "before" ? "Insert block before" : "Insert block after"
      }
      className={[
        "absolute left-1/2 -translate-x-1/2 z-10",
        "hidden cursor-pointer group-hover:flex items-center gap-1.5 group/btn",
        position === "before"
          ? "top-0 -translate-y-1/2"
          : "bottom-0 translate-y-1/2",
      ].join(" ")}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white border border-gray-300 text-gray-400 group-hover/btn:border-blue-400 group-hover/btn:text-blue-500 group-hover/btn:bg-blue-50 transition-all shadow-sm text-xs font-medium leading-none">
        +
      </span>
    </button>
  );
}

// ── Main Canvas ──────────────────────────────────────────────────────────────

export default function Canvas() {
  const form = useFormStore((state) => state.form);
  const selectedBlock = useFormStore((state) => state.selectedBlock);
  const setPendingInsert = useFormStore((state) => state.setPendingInsert);
  const draftDesign = useFormStore((state) => state.draftDesign);
  const designDrawerOpen = useFormStore((state) => state.designDrawerOpen);

  const welcomeScreen = form?.content?.welcomeScreen;
  const thankYouScreen = form?.content?.thankYouScreen;
  const questions = form?.content?.questions ?? [];
  // While the design drawer is open, preview uses draftDesign so changes are
  // visible in the canvas before they are committed/saved.
  const committedDesign = form?.content?.design ?? {};
  const design = designDrawerOpen && draftDesign ? draftDesign : committedDesign;

  // Load the selected Google Font whenever it changes
  useEffect(() => {
    if (design.google_font) loadGoogleFont(design.google_font);
  }, [design.google_font]);

  let defaultColors = {};

  DESIGN_SETTINGS.map((settings) => {
    if (settings.section === "Colours") {
      settings.fields.map((field) => {
        defaultColors[field.key] = field.default;
      });
    }
  });

  let content = <EmptyState />;
  let selectedIndex = -1;

  if (selectedBlock) {
    if (selectedBlock.type === "welcome") {
      content = <WelcomePreview screen={welcomeScreen} design={design} />;
    } else if (selectedBlock.type === "thankYou") {
      content = <ThankYouPreview screen={thankYouScreen} design={design} />;
    } else if (selectedBlock.type === "question") {
      const question = questions.find((q) => q.id === selectedBlock.id);
      selectedIndex = questions.findIndex((q) => q.id === selectedBlock.id);
      content = <QuestionPreview question={question} design={design} />;
    }
  }

  const isQuestion = selectedBlock?.type === "question" && selectedIndex !== -1;

  return (
    <>
      <style>
        {`.btn-primary {
          background-color: var(--btn-color);
          color: var(--btn-text-color);
          border-radius: var(--corner-radius);
        }
        .btn-primary:hover {
          background-color: var(--btn-hover-color);
        }
        .choice-item {
          border-radius: var(--corner-radius);
        }
        .choice-indicator {
          border-radius: calc(var(--corner-radius) / 1.5);
        }`}
      </style>
      <div
        className="group relative bg-white p-2 rounded-2xl md:px-4 grow border border-dashed border-gray-400"
        style={{
          backgroundColor: design.bg_color
            ? design.bg_color
            : defaultColors.bg_color,
          "--btn-color": design.button_color
            ? design.button_color
            : defaultColors.button_color,
          "--btn-hover-color": design.button_hover_color
            ? design.button_hover_color
            : defaultColors.button_hover_color,
          "--btn-text-color": design.button_text_color
            ? design.button_text_color
            : defaultColors.button_text_color,
          "--title-color": design.title_color
            ? design.title_color
            : defaultColors.title_color,
          "--desc-color": design.description_color
            ? design.description_color
            : defaultColors.description_color,
          "--answer-color": design.answer_color
            ? design.answer_color
            : defaultColors.answer_color,
          "--hint-color": design.hint_color
            ? design.hint_color
            : defaultColors.hint_color,
          "--star-color": design.star_color
            ? design.star_color
            : defaultColors.star_color,
          fontFamily: design.google_font
            ? `"${design.google_font}", sans-serif`
            : "inherit",
          "--corner-radius":
            design.border_radius === "angular"
              ? "0px"
              : design.border_radius === "full"
              ? "9999px"
              : "8px",
        }}
      >
        {isQuestion && (
          <InsertButton
            position="before"
            onClick={() => setPendingInsert(selectedIndex)}
          />
        )}
        {content}
        {isQuestion && (
          <InsertButton
            position="after"
            onClick={() => setPendingInsert(selectedIndex + 1)}
          />
        )}
      </div>
    </>
  );
}
