import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PlusIcon, XIcon } from "lucide-react";
import { __ } from '@wordpress/i18n';

// ── Single sortable option row ────────────────────────────────────────────────

function OptionRow({ option, onChange, onDelete, canDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex items-center gap-1.5 rounded-md transition-shadow",
        isDragging ? "opacity-50 shadow-md" : "opacity-100",
      ].join(" ")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label={__( 'Drag to reorder', 'wpflowforms' )}
        className="shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none focus:outline-none"
      >
        <GripVertical width={14} height={14} />
      </button>

      {/* Label input */}
      <input
        type="text"
        value={option.label}
        onChange={(e) => onChange(option.id, e.target.value)}
        placeholder={__( 'Option label', 'wpflowforms' )}
        className="flex-1 min-w-0 text-sm/6 border border-gray-200 rounded-md px-2 py-1 bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
      />

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(option.id)}
        disabled={!canDelete}
        aria-label={__( 'Remove option', 'wpflowforms' )}
        className="shrink-0 text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none transition-colors"
      >
        <XIcon width={14} height={14} />
      </button>
    </div>
  );
}

// ── OptionsEditor ─────────────────────────────────────────────────────────────
// Manages an array of { id, label } objects.
// The `value` prop is the raw array stored in block.content.options.
// Calls `onChange` with the updated array on every mutation.

export default function OptionsEditor({ field, value, onChange }) {
  // Normalise: ensure every option has a stable string id.
  const options = (value ?? field.default ?? []).map((opt, i) =>
    typeof opt === "string"
      ? { id: `opt-${i}`, label: opt }
      : { id: opt.id ?? `opt-${i}`, label: opt.label ?? opt.value ?? "" },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange(arrayMove(options, oldIndex, newIndex));
    }
  };

  const handleChange = (id, label) => {
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const handleDelete = (id) => {
    onChange(options.filter((o) => o.id !== id));
  };

  const handleAdd = () => {
    onChange([
      ...options,
      { id: `opt-${Date.now()}`, label: "" },
    ]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        {field.label}
      </label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {options.map((opt) => (
              <OptionRow
                key={opt.id}
                option={opt}
                onChange={handleChange}
                onDelete={handleDelete}
                canDelete={options.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add option */}
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus:outline-none"
      >
        <PlusIcon width={13} height={13} />
        {__( 'Add option', 'wpflowforms' )}
      </button>

      {field.hint && (
        <p className="mt-1.5 text-xs text-gray-400 leading-snug">{field.hint}</p>
      )}
    </div>
  );
}