import { __ } from '@wordpress/i18n';
import { useFormStore } from "../store/useFormStore";
import BLOCK_SETTINGS from "./right-panel/blockSettings";
import OptionsEditor from "./right-panel/OptionsEditor";

// ── Save-status indicator ────────────────────────────────────────────────────

function SaveStatusIcon({ status }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <svg className="w-4 h-4 animate-pulse text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.455-8.766 5.25 5.25 0 0 1 10.338-1.036A3.75 3.75 0 0 1 17.25 19.5H6.75Z" />
        </svg>
        <span className="text-gray-600 font-medium">{ __( 'Saving…', 'flowforms' ) }</span>
      </span>
    );
  }
  if (status === "unsaved") {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <span className="text-gray-600 font-medium">{ __( 'Unsaved', 'flowforms' ) }</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 2 2 4-4" />
      </svg>
      <span className="text-gray-600 font-medium">{ __( 'Saved', 'flowforms' ) }</span>
    </span>
  );
}

// ── Field renderers ──────────────────────────────────────────────────────────

function ToggleField({ field, value, onChange }) {
  const checked = value ?? field.default ?? false;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">{field.label}</p>
        {field.hint && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{field.hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none",
          checked ? "bg-ff-primary-500" : "bg-gray-300",
        ].join(" ")}
      >
        <span className={[
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")} />
      </button>
    </div>
  );
}

function TextField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
      <input
        type="text"
        value={value ?? field.default ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.default || ""}
        className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1 leading-snug">{field.hint}</p>}
    </div>
  );
}

function TextareaField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
      <textarea
        rows={3}
        value={value ?? field.default ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.default || ""}
        className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none placeholder:text-gray-300"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1 leading-snug">{field.hint}</p>}
    </div>
  );
}

function NumberField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
      <input
        type="number"
        value={value ?? field.default ?? ""}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      {field.hint && <p className="text-xs text-gray-400 mt-1 leading-snug">{field.hint}</p>}
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
      <select
        value={value ?? field.default ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
      >
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {field.hint && <p className="text-xs text-gray-400 mt-1 leading-snug">{field.hint}</p>}
    </div>
  );
}

function MediaImageField({ field, value, onChange, blockSettings, onSiblingChange }) {
  // value shape: { id: number, url: string } | null
  const image = value && value.url ? value : null;

  // bgLayout: "wallpaper" (default) | "split"
  const bgLayout    = blockSettings?.bgLayout    ?? "wallpaper";
  // bgPosition: "left" (default) | "right"  — only relevant when split
  const bgPosition  = blockSettings?.bgPosition  ?? "left";
  // bgBrightness: -100 (darkest) → 0 (neutral) → +100 (brightest)
  const bgBrightness = blockSettings?.bgBrightness ?? 0;

  // Dynamic label based on current layout
  const imageLabel = !image
    ? __( 'Background image', 'flowforms' )
    : bgLayout === "split"
      ? __( 'Split image', 'flowforms' )
      : __( 'Cover image', 'flowforms' );

  const openMediaFrame = () => {
    const frame = window.wp.media({
      title: __( 'Select Background Image', 'flowforms' ),
      button: { text: __( 'Use this image', 'flowforms' ) },
      multiple: false,
      library: { type: "image" },
    });
    frame.on("select", () => {
      const attachment = frame.state().get("selection").first().toJSON();
      onChange({ id: attachment.id, url: attachment.url });
    });
    frame.open();
  };

  const removeImage = () => {
    onChange(null);
    // Clear layout/position when image is removed
    onSiblingChange("bgLayout",    "wallpaper");
    onSiblingChange("bgPosition",  "left");
    onSiblingChange("bgBrightness", 0);
  };

  return (
    <fieldset className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      {/* ── Group label ── */}
      <legend className="mx-3 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
        { __( 'Background', 'flowforms' ) }
      </legend>

      <div className="px-3 pb-4 pt-2 space-y-3">
        {/* ── Image picker ── */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            { __( 'Image', 'flowforms' ) }
          </label>

          {image ? (
            <div className="relative rounded-md overflow-hidden border border-gray-200 group/img">
              <img
                src={image.url}
                alt={ __( 'Background', 'flowforms' ) }
                className="w-full h-24 object-cover block"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={removeImage}
                title={ __( 'Remove image', 'flowforms' ) }
                className="ff-touch-visible absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white hover:text-red-500 shadow"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l10 10M12 2 2 12" />
                </svg>
              </button>
              <button
                type="button"
                onClick={openMediaFrame}
                title={ __( 'Replace image', 'flowforms' ) }
                className="ff-touch-visible absolute bottom-1.5 right-1.5 px-2 py-0.5 text-xs font-medium rounded bg-white/90 text-gray-700 opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-white shadow"
              >
                { __( 'Replace', 'flowforms' ) }
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openMediaFrame}
              className="w-full h-20 flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="2" y="2" width="16" height="16" rx="2" />
                <circle cx="7" cy="7" r="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 13l4-4 3 3 3-4 4 5" />
              </svg>
              <span className="text-xs font-medium">{ __( 'Select image', 'flowforms' ) }</span>
            </button>
          )}

          {field.hint && (
            <p className="text-xs text-gray-400 mt-1 leading-snug">{field.hint}</p>
          )}
        </div>

        {/* ── Layout + Position — only when image exists, separated by a hairline ── */}
        {image && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{ __( 'Layout', 'flowforms' ) }</label>
              <select
                value={bgLayout}
                onChange={(e) => onSiblingChange("bgLayout", e.target.value)}
                className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
              >
                <option value="wallpaper">{ __( 'Wallpaper', 'flowforms' ) }</option>
                <option value="split">{ __( 'Split', 'flowforms' ) }</option>
              </select>
            </div>

            {bgLayout === "split" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{ __( 'Position', 'flowforms' ) }</label>
                <select
                  value={bgPosition}
                  onChange={(e) => onSiblingChange("bgPosition", e.target.value)}
                  className="w-full text-sm/6 border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer"
                >
                  <option value="left">{ __( 'Left', 'flowforms' ) }</option>
                  <option value="right">{ __( 'Right', 'flowforms' ) }</option>
                </select>
              </div>
            )}

            {bgLayout === "wallpaper" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">{ __( 'Brightness', 'flowforms' ) }</label>
                  <span className="text-xs tabular-nums text-gray-400">
                    {bgBrightness > 0 ? `+${bgBrightness}` : bgBrightness}
                  </span>
                </div>
                {/* Track gradient: black left → transparent centre → white right */}
                <div className="relative h-1.5 rounded-full mb-1" style={{
                  background: "linear-gradient(to right, #000 0%, transparent 50%, #fff 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
                }}>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={10}
                    value={bgBrightness}
                    onChange={(e) => onSiblingChange("bgBrightness", Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                  {/* Thumb dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-300 shadow pointer-events-none"
                    style={{ left: `calc(${(bgBrightness + 100) / 200 * 100}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between text-gray-400 mt-0.5" style={{ fontSize: "9px" }}>
                  <span>{ __( 'Darker', 'flowforms' ) }</span>
                  <span>{ __( 'Brighter', 'flowforms' ) }</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </fieldset>
  );
}

function SettingsField({ field, blockContent, blockSettings, onChange, onSiblingChange }) {
  // Read value from the correct namespace sub-object
  const value = field.namespace === "content"
    ? blockContent?.[field.key]
    : blockSettings?.[field.key];

  const props = { field, value, onChange };
  switch (field.type) {
    case "toggle":      return <ToggleField       {...props} />;
    case "textarea":    return <TextareaField     {...props} />;
    case "number":      return <NumberField       {...props} />;
    case "select":      return <SelectField       {...props} />;
    case "options":     return <OptionsEditor     {...props} />;
    case "media_image": return (
      <MediaImageField
        {...props}
        blockSettings={blockSettings}
        onSiblingChange={onSiblingChange}
      />
    );
    default:            return <TextField         {...props} />;
  }
}

// ── Settings panel ───────────────────────────────────────────────────────────

function BlockSettingsPanel({ blockType, blockContent, blockSettings, onFieldChange }) {
  const schema = BLOCK_SETTINGS[blockType];

  if (!schema) {
    return <p className="text-xs text-gray-400 px-4 pt-4">{ __( 'No settings available for this block.', 'flowforms' ) }</p>;
  }

  return (
    <div className="overflow-y-auto flex-1 pb-8">
      {schema.sections.map((section) => (
        <div key={section.title} className="px-4 pt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {section.title}
          </p>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <SettingsField
                key={`${field.namespace}.${field.key}`}
                field={field}
                blockContent={blockContent}
                blockSettings={blockSettings}
                onChange={(val) => onFieldChange(field.namespace, field.key, val)}
                onSiblingChange={(key, val) => onFieldChange("settings", key, val)}
              />
            ))}
          </div>
          <div className="mt-5 border-t border-gray-200" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center text-gray-500 px-6">
      <svg className="w-8 h-8 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
      </svg>
      <p className="text-xs leading-relaxed">{ __( 'Select a block to see its settings', 'flowforms' ) }</p>
    </div>
  );
}

// ── Main RightPanel ──────────────────────────────────────────────────────────

export default function RightPanel({ className }) {
  const form = useFormStore((state) => state.form);
  const selectedBlock = useFormStore((state) => state.selectedBlock);
  const saveStatus = useFormStore((state) => state.saveStatus);
  const updateBlockField = useFormStore((state) => state.updateBlockField);

  // ── Derive active block data ─────────────────────────────────────────────
  let blockId = null;
  let blockType = null;
  let blockLabel = null;
  let blockContent = {};
  let blockSettings = {};

  if (selectedBlock) {
    if (selectedBlock.type === "welcome") {
      blockId = "welcome";
      blockType = "welcome";
      blockLabel = __( 'Welcome screen', 'flowforms' );
      blockContent  = form?.content?.welcomeScreen?.content  ?? {};
      blockSettings = form?.content?.welcomeScreen?.settings ?? {};
    } else if (selectedBlock.type === "thankYou") {
      blockId = "thankYou";
      blockType = "thankYou";
      blockLabel = __( 'Thank you screen', 'flowforms' );
      blockContent  = form?.content?.thankYouScreen?.content  ?? {};
      blockSettings = form?.content?.thankYouScreen?.settings ?? {};
    } else if (selectedBlock.type === "question") {
      const question = form?.content?.questions?.find((q) => q.id === selectedBlock.id);
      blockId = selectedBlock.id;
      blockType = question?.type ?? selectedBlock.questionType;
      blockLabel = BLOCK_SETTINGS[blockType]?.label ?? blockType;
      blockContent  = question?.content  ?? {};
      blockSettings = question?.settings ?? {};
    }
  }

  // namespace = "content" | "settings"
  const handleFieldChange = (namespace, key, value) => {
    if (!blockId || !blockType) return;
    updateBlockField(blockId, blockType, namespace, key, value);
  };

  return (
    <div className={`p-3 pl-1.5 min-h-0 ${className}`}>
      <div className="h-full rounded-2xl bg-white flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 shrink-0 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ __( 'Settings', 'flowforms' ) }</p>
            {blockLabel && (
              <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">{blockLabel}</p>
            )}
          </div>
          <div className="shrink-0 mt-0.5 rounded-sm bg-gray-100 px-2.5 py-1.5">
            <SaveStatusIcon status={saveStatus} />
          </div>
        </div>

        {/* Body */}
        {selectedBlock && blockType ? (
          <BlockSettingsPanel
            blockType={blockType}
            blockContent={blockContent}
            blockSettings={blockSettings}
            onFieldChange={handleFieldChange}
          />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}