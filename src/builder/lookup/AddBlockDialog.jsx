import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../components/ui/command";
import FIELDS from "../components/left-panel/fields";
import { useFormStore } from "../store/useFormStore";
import { useEffect } from "react";

export default function AddBlockDialog() {
  const addBlockDialogOpen = useFormStore((state) => state.addBlockDialogOpen);
  const setAddBlockDialogOpen = useFormStore(
    (state) => state.setAddBlockDialogOpen,
  );
  const addQuestion = useFormStore((state) => state.addQuestion);
  const insertQuestion = useFormStore((state) => state.insertQuestion);
  const pendingInsert = useFormStore((state) => state.pendingInsert);
  const clearPendingInsert = useFormStore((state) => state.clearPendingInsert);

  // Open dialog whenever Canvas requests an insert-before/after
  useEffect(() => {
    if (pendingInsert !== null) setAddBlockDialogOpen(true);
  }, [pendingInsert]);

  const handleSelect = (field) => {
    if (pendingInsert !== null) {
      insertQuestion(field.type, pendingInsert);
    } else {
      addQuestion(field.type);
    }
    setAddBlockDialogOpen(false);
  };

  const handleOpenChange = (open) => {
    setAddBlockDialogOpen(open);
    if (!open) clearPendingInsert();
  };

  return (
    <CommandDialog open={addBlockDialogOpen} onOpenChange={handleOpenChange}>
      <Command>
        <CommandInput placeholder="Search blocks..." />
        <CommandList>
          <CommandEmpty>No blocks found.</CommandEmpty>
          <CommandGroup heading="Blocks">
            {FIELDS.map((field) => (
              <CommandItem
                key={field.type}
                onSelect={() => handleSelect(field)}
              >
                <field.icon color={field.color} />
                <span>{field.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
