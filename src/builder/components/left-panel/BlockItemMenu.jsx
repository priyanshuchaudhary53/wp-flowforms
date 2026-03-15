import { CopyIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useFormStore } from "../../store/useFormStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function BlockItemMenu({ question }) {
  const setSelectedBlock = useFormStore((state) => state.setSelectedBlock);
  const duplicateQuestion = useFormStore((state) => state.duplicateQuestion);
  const deleteQuestion = useFormStore((state) => state.deleteQuestion);

  const handleEdit = () => {
    setSelectedBlock({
      id: question.id,
      type: "question",
      questionType: question.type,
    });
  };

  const handleDuplicate = () => {
    duplicateQuestion(question.id);
  };

  const handleDelete = () => {
    deleteQuestion(question.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-full p-2 shrink-0 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer focus:outline-none">
          <span className="sr-only">Open options</span>
          <EllipsisVerticalIcon width={14} height={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleEdit}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate}>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}