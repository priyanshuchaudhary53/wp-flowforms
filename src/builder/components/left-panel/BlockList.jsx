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
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { GripVertical } from "lucide-react";
import { __ } from '@wordpress/i18n';
import { useFormStore } from "../../store/useFormStore";
import FIELDS from "./fields";
import BlockItemMenu from "./BlockItemMenu";

function BlockItem({ question, index }) {
  const field = FIELDS.find((f) => f.type === question.type);
  const Icon = field?.icon;

  const selectedBlock = useFormStore((state) => state.selectedBlock);
  const setSelectedBlock = useFormStore((state) => state.setSelectedBlock);
  const isSelected =
    selectedBlock?.type === "question" && selectedBlock?.id === question.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "w-full h-10 relative flex items-center text-xs border-2 rounded-md transition-all",
        isSelected ? "border-dashed" : "border-transparent",
        isDragging ? "opacity-50 shadow-md" : "opacity-100",
        !isDragging && !isSelected ? "hover:brightness-95" : "",
      ].join(" ")}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        backgroundColor: field.color + "40",
        ...(isSelected && field?.color ? { borderColor: field.color } : {}),
      }}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label={__( 'Drag to reorder', 'flowforms' )}
        className="h-full p-2 shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none focus:outline-none"
      >
        <GripVertical width={14} height={14} />
      </button>

      {/* Select button */}
      <button
        className="h-full py-2 flex items-center gap-2 flex-1 min-w-0 cursor-pointer text-left"
        onClick={() =>
          setSelectedBlock({
            id: question.id,
            type: "question",
            questionType: question.type,
          })
        }
      >
        {Icon && (
          <div className="w-6 h-6 shrink-0 rounded flex items-center justify-center">
            <Icon width={16} height={16} style={{ color: field.color }} />
          </div>
        )}
        <p className="truncate">{`${index + 1}. ${question.content.title}`}</p>
      </button>

      <BlockItemMenu question={question} />
    </div>
  );
}

export default function BlockList({ questions, onAddClick }) {
  const reorderQuestions = useFormStore((state) => state.reorderQuestions);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderQuestions(arrayMove(questions, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex justify-between items-center shrink-0">
        <p className="text-xs/5 text-gray-600">{__( 'Blocks', 'flowforms' )}</p>
        <button
          onClick={onAddClick}
          className="text-gray-500 cursor-pointer hover:text-gray-600"
        >
          <span className="sr-only">{__( 'Add new block', 'flowforms' )}</span>
          <PlusCircleIcon width={20} height={20} />
        </button>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5">
        {questions?.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((q, i) => (
                <BlockItem key={q.id} question={q} index={i} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <button
            onClick={onAddClick}
            className="w-full text-gray-900 p-2 h-10 relative border border-dashed border-gray-400 cursor-pointer flex items-center justify-between text-xs rounded-md transition-all hover:bg-gray-50"
          >
            <p className="ml-1 truncate">{__( 'Add a block', 'flowforms' )}</p>
          </button>
        )}
      </div>
    </div>
  );
}