import { StarIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useFormStore } from "../store/useFormStore";
import DESIGN_SETTINGS from "./design/designSettings.jsx";
import { getFontScale } from "./design/fontScale";
import { loadGoogleFont } from "../lib/googleFonts";
import { resolveBackground } from "../lib/resolveBackground";

// ── Background wrapper ──────────────────────────────────────────────────────

function BgWrapper({ bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness, children }) {
  const brightness = bgBrightness ?? 0;
  const overlayStyle = brightness === 0
    ? null
    : {
        backgroundColor: brightness < 0 ? "rgb(0,0,0)" : "rgb(255,255,255)",
        opacity: Math.abs(brightness) / 100,
      };

  // Overlay for the global background in split mode
  const globalBrightnessVal = globalBrightness ?? 0;
  const globalOverlayStyle = globalBrightnessVal === 0
    ? null
    : {
        backgroundColor: globalBrightnessVal < 0 ? "rgb(0,0,0)" : "rgb(255,255,255)",
        opacity: Math.abs(globalBrightnessVal) / 100,
      };

  if (bgLayout === "split") {
    const imageLeft = bgPosition !== "right";
    return (
      <div className="flex rounded-2xl h-full w-full overflow-hidden relative">
        {/* Global wallpaper behind everything in split mode */}
        {globalBg && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${globalBg})` }}
            />
            {globalOverlayStyle && (
              <div className="absolute inset-0" style={globalOverlayStyle} />
            )}
          </>
        )}
        {imageLeft && bgImage && (
          <div
            className="relative w-1/2 shrink-0 h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}
        <div className="relative flex-1 h-full overflow-y-auto p-2 md:px-4">
          {children}
        </div>
        {!imageLeft && bgImage && (
          <div
            className="relative w-1/2 shrink-0 h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}
      </div>
    );
  }

  // Wallpaper mode — no image at all
  if (!bgImage) {
    return (
      <div className="flex-1 min-h-0 w-full p-2 md:px-4 overflow-y-auto">
        {children}
      </div>
    );
  }

  // Wallpaper mode — with image
  return (
    <div className="h-full w-full p-2 md:px-4 overflow-y-auto">
      <div
        className="absolute inset-0 rounded-2xl bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {overlayStyle && <div className="absolute inset-0" style={overlayStyle} />}
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

// ── Screen previews ──────────────────────────────────────────────────────────

function WelcomePreview({ screen, design }) {
  const c = screen?.content ?? {};
  const s = screen?.settings ?? {};

  const alignment =
    s.layout && s.layout !== "default" ? s.layout : (design.alignment ?? "center");

  const { bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness } =
    resolveBackground(s, design);

  return (
    <BgWrapper
      bgImage={bgImage}
      bgLayout={bgLayout}
      bgPosition={bgPosition}
      bgBrightness={bgBrightness}
      globalBg={globalBg}
      globalBrightness={globalBrightness}
    >
      <div
        className={[
          "relative flex flex-col",
          alignment === "center" ? "items-center" : "items-start",
          "min-h-full max-w-3xl mx-auto px-8 gap-5 justify-center py-8",
        ].join(" ")}
      >
        <div
          className={[
            "flex flex-col",
            alignment === "center"
              ? "items-center text-center"
              : "items-start text-start",
            "gap-y-3",
          ].join(" ")}
        >
          <h1
            className="font-bold text-(--title-color)"
            style={{ fontSize: "var(--fs-title)" }}
          >
            {c.title || "Welcome!"}
          </h1>
          {c.description && (
            <p
              className="leading-relaxed text-(--desc-color)"
              style={{ fontSize: "var(--fs-body)" }}
            >
              {c.description}
            </p>
          )}
        </div>
        <button
          className="px-6 py-2.5 text-white font-medium rounded-lg transition-colors btn-primary"
          style={{ fontSize: "var(--fs-body)" }}
        >
          {c.buttonLabel || "Start"}
        </button>
      </div>
    </BgWrapper>
  );
}

function ThankYouPreview({ screen, design }) {
  const c = screen?.content ?? {};
  const s = screen?.settings ?? {};

  const alignment =
    s.layout && s.layout !== "default" ? s.layout : (design.alignment ?? "center");

  const { bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness } =
    resolveBackground(s, design);

  return (
    <BgWrapper
      bgImage={bgImage}
      bgLayout={bgLayout}
      bgPosition={bgPosition}
      bgBrightness={bgBrightness}
      globalBg={globalBg}
      globalBrightness={globalBrightness}
    >
      <div
        className={[
          "relative flex flex-col",
          alignment === "center" ? "items-center" : "items-start",
          "min-h-full max-w-3xl mx-auto px-8 gap-5 justify-center py-8",
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
          <h1
            className="font-bold text-(--title-color)"
            style={{ fontSize: "var(--fs-title)" }}
          >
            {c.title || "Thank you!"}
          </h1>
          {c.description && (
            <p
              className="leading-relaxed text-(--desc-color)"
              style={{ fontSize: "var(--fs-body)" }}
            >
              {c.description}
            </p>
          )}
        </div>

        {s.showSocialShare && (
          <div
            className={[
              "flex flex-col gap-2.5",
              alignment === "center" ? "items-center" : "items-start",
            ].join(" ")}
          >
            <p
              className="text-(--hint-color)"
              style={{ fontSize: "var(--fs-hint)" }}
            >
              Share this form
            </p>
            <div className="flex gap-2.5">
              {/* X / Twitter */}
              <div
                className="flex items-center justify-center w-10 h-10 border-[1.5px] border-(--answer-color) text-(--answer-color) rounded-(--corner-radius)"
                title="X / Twitter"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              {/* Facebook */}
              <div
                className="flex items-center justify-center w-10 h-10 border-[1.5px] border-(--answer-color) text-(--answer-color) rounded-(--corner-radius)"
                title="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              {/* LinkedIn */}
              <div
                className="flex items-center justify-center w-10 h-10 border-[1.5px] border-(--answer-color) text-(--answer-color) rounded-(--corner-radius)"
                title="LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </BgWrapper>
  );
}

// ── Question preview ─────────────────────────────────────────────────────────

function QuestionPreview({ question, design }) {
  const c = question?.content ?? {};
  const s = question?.settings ?? {};

  const alignment = design.alignment ?? "center";

  const { bgImage, bgLayout, bgPosition, bgBrightness, globalBg, globalBrightness } =
    resolveBackground(s, design);

  return (
    <BgWrapper
      bgImage={bgImage}
      bgLayout={bgLayout}
      bgPosition={bgPosition}
      bgBrightness={bgBrightness}
      globalBg={globalBg}
      globalBrightness={globalBrightness}
    >
      <div
        className={[
          "relative flex flex-col",
          alignment === "center" ? "items-center" : "items-start",
          "min-h-full max-w-3xl mx-auto px-8 gap-5 justify-center py-8",
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
          <h2
            className="font-semibold text-(--title-color)"
            style={{ fontSize: "var(--fs-subtitle)" }}
          >
            {c.title || "Untitled question"}
          </h2>
          {c.description && (
            <p
              className="text-(--desc-color)"
              style={{ fontSize: "var(--fs-body)" }}
            >
              {c.description}
            </p>
          )}
        </div>

        <QuestionInputMockup question={question} design={design} />

        <div className="flex items-center gap-3 mt-2">
          <button
            className="px-5 py-2 font-medium text-white rounded-lg transition-colors btn-primary"
            style={{ fontSize: "var(--fs-body)" }}
          >
            {c.buttonLabel || "OK"}
          </button>
          <span
            className="text-(--hint-color)"
            style={{ fontSize: "var(--fs-hint)" }}
          >
            press Enter ↵
          </span>
        </div>
      </div>
    </BgWrapper>
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
        className="w-full border-b bg-transparent py-2 outline-none border-(--answer-color) placeholder:text-(--answer-color)/50"
        style={{ fontSize: "var(--fs-body)" }}
      />
    );
  }
  if (type === "long_text") {
    return (
      <textarea
        readOnly
        rows={s.rows || 4}
        placeholder={s.placeholder || "Your answer here..."}
        className="w-full border-b bg-transparent py-2 outline-none resize-none border-(--answer-color) placeholder:text-(--answer-color)/50"
        style={{ fontSize: "var(--fs-body)" }}
      />
    );
  }
  if (type === "email") {
    return (
      <input
        readOnly
        type="email"
        placeholder={s.placeholder || "name@example.com"}
        className="w-full border-b bg-transparent py-2 outline-none border-(--answer-color) placeholder:text-(--answer-color)/50"
        style={{ fontSize: "var(--fs-body)" }}
      />
    );
  }
  if (type === "number") {
    return (
      <div className="flex w-full items-center gap-1 border-b py-2 border-(--answer-color)">
        {c.prefix && (
          <span
            className="text-(--answer-color)"
            style={{ fontSize: "var(--fs-body)" }}
          >
            {c.prefix}
          </span>
        )}
        <input
          readOnly
          type="number"
          placeholder={s.placeholder || "0"}
          className="flex-1 bg-transparent outline-none placeholder:text-(--answer-color)/50"
          style={{ fontSize: "var(--fs-body)" }}
        />
        {c.suffix && (
          <span
            className="text-(--answer-color)"
            style={{ fontSize: "var(--fs-body)" }}
          >
            {c.suffix}
          </span>
        )}
      </div>
    );
  }
  if (type === "multiple_choice") {
    const options =
      Array.isArray(c.options) && c.options.length > 0
        ? c.options
        : [{ label: "Option A" }, { label: "Option B" }, { label: "Option C" }];

    const layoutClass =
      s.layout === "horizontal" ? "flex flex-wrap" :
      s.layout === "grid_2"     ? "grid grid-cols-2" :
                                  "flex flex-col";

    const alignClass =
      s.layout === "grid_2"     ? "" :
      s.layout === "horizontal" ? (alignment === "center" ? "justify-center" : "justify-start") :
                                  (alignment === "center" ? "items-center"   : "items-start");

    return (
      <div
        className={[layoutClass, alignClass, "gap-2"].filter(Boolean).join(" ")}
      >
        {options.map((opt, i) => (
          <label
            key={i}
            className={[
              s.layout === "vertical" ? "w-full" : "",
              "choice-item flex items-center gap-3 p-2.5 pr-4 border cursor-pointer transition-[background-color] hover:bg-(--answer-color)/10 text-(--answer-color) border-(--answer-color)"
            ].filter(Boolean).join(" ")}
            style={{ fontSize: "var(--fs-body)" }}
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            {opt.label || <span className="opacity-40 italic">Untitled option</span>}
          </label>
        ))}
        {s.allowOther && (
          <div
            className={[
              s.layout === "vertical" ? "w-full" : "",
              "choice-item flex items-center gap-3 p-2.5 pr-4 border text-(--answer-color) border-(--answer-color) opacity-60"
            ].filter(Boolean).join(" ")}
            style={{ fontSize: "var(--fs-body)" }}
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            <span className="italic">Other</span>
          </div>
        )}
      </div>
    );
  }
  if (type === "checkboxes") {
    const options =
      Array.isArray(c.options) && c.options.length > 0
        ? c.options
        : [{ label: "Option A" }, { label: "Option B" }, { label: "Option C" }];

    const layoutClass =
      s.layout === "horizontal" ? "flex flex-wrap" :
      s.layout === "grid_2"     ? "grid grid-cols-2" :
                                  "flex flex-col";

    const alignClass =
      s.layout === "grid_2"     ? "" :
      s.layout === "horizontal" ? (alignment === "center" ? "justify-center" : "justify-start") :
                                  (alignment === "center" ? "items-center"   : "items-start");

    return (
      <div
        className={[layoutClass, alignClass, "gap-2"].filter(Boolean).join(" ")}
      >
        {options.map((opt, i) => (
          <label
            key={i}
            className={[
              s.layout === "vertical" ? "w-full" : "",
              "choice-item flex items-center gap-3 p-2.5 pr-4 border cursor-pointer transition-[background-color] hover:bg-(--answer-color)/10 text-(--answer-color) border-(--answer-color)"
            ].filter(Boolean).join(" ")}
            style={{ fontSize: "var(--fs-body)" }}
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            {opt.label || <span className="opacity-40 italic">Untitled option</span>}
          </label>
        ))}
        {s.allowOther && (
          <div
            className={[
              s.layout === "vertical" ? "w-full" : "",
              "choice-item flex items-center gap-3 p-2.5 pr-4 border text-(--answer-color) border-(--answer-color) opacity-60"
            ].filter(Boolean).join(" ")}  
            style={{ fontSize: "var(--fs-body)" }}
          >
            <span className="choice-indicator w-4 h-4 border-2 shrink-0 border-(--answer-color)" />
            <span className="italic">Other</span>
          </div>
        )}
      </div>
    );
  }
  if (type === "rating") {
    let steps = s.steps || 5;
    if (steps > 10) steps = 10;
    return (
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: steps }).map((_, i) => (
            <button key={i} style={{ color: `var(--star-color)` }}>
              <StarIcon width={40} height={40} />
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (type === "yes_no") {
    return (
      <div className="flex gap-3">
        <button
          className="choice-item flex items-center gap-2 px-5 py-2.5 border transition-[background-color] text-(--answer-color) border-(--answer-color) hover:bg-(--answer-color)/10"
          style={{ fontSize: "var(--fs-body)" }}
        >
          {c.yesLabel || "Yes"}
        </button>
        <button
          className="choice-item flex items-center gap-2 px-5 py-2.5 border transition-[background-color] text-(--answer-color) border-(--answer-color) hover:bg-(--answer-color)/10"
          style={{ fontSize: "var(--fs-body)" }}
        >
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
  const form            = useFormStore((state) => state.form);
  const selectedBlock   = useFormStore((state) => state.selectedBlock);
  const setPendingInsert = useFormStore((state) => state.setPendingInsert);
  const draftDesign     = useFormStore((state) => state.draftDesign);
  const designDrawerOpen = useFormStore((state) => state.designDrawerOpen);

  const welcomeScreen  = form?.content?.welcomeScreen;
  const thankYouScreen = form?.content?.thankYouScreen;
  const questions      = form?.content?.questions ?? [];

  // While the design drawer is open, preview uses draftDesign so changes are
  // visible in the canvas before they are committed/saved.
  const committedDesign = form?.design ?? {};
  const design =
    designDrawerOpen && draftDesign ? draftDesign : committedDesign;

  // Load the selected Google Font whenever it changes
  useEffect(() => {
    if (design.google_font) loadGoogleFont(design.google_font);
  }, [design.google_font]);

  let defaultColors = {};
  DESIGN_SETTINGS.forEach((settings) => {
    if (settings.section === "Colours") {
      settings.fields.forEach((field) => {
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
      selectedIndex  = questions.findIndex((q) => q.id === selectedBlock.id);
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
        className="group relative bg-white rounded-2xl grow min-h-0 border border-dashed border-gray-400 flex flex-col"
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
          ...Object.fromEntries(
            Object.entries(getFontScale(design.font_size)).map(
              ([role, size]) => [`--fs-${role}`, size],
            ),
          ),
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