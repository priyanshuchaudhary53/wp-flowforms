import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../components/ui/command";
import { FIELD_CATEGORIES } from "../components/left-panel/fieldCategories";
import PRO_FIELDS from "../components/left-panel/proFields";
import { useFormStore } from "../store/useFormStore";
import { useEffect, useState } from "react";
import { LockIcon } from "lucide-react";
import { __ } from "@wordpress/i18n";
import ProUpgradeDialog from "./ProUpgradeDialog";

export default function AddBlockDialog() {
  const [proUpgradeField, setProUpgradeField] = useState(null);
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
    <>
    <ProUpgradeDialog
      field={proUpgradeField}
      onClose={() => setProUpgradeField(null)}
    />
    <CommandDialog open={addBlockDialogOpen} onOpenChange={handleOpenChange}>
      <Command>
        <CommandInput placeholder={__( 'Search blocks...', 'flowforms' )} />
        <CommandList>
          <CommandEmpty>{__( 'No blocks found.', 'flowforms' )}</CommandEmpty>
          {FIELD_CATEGORIES.map((category) => (
            <CommandGroup key={category.name} heading={category.name}>
              {category.fields.map((field) => {
                const isPro = PRO_FIELDS.some((f) => f.type === field.type);
                return (
                  <CommandItem
                    key={field.type}
                    className={isPro ? "opacity-50" : ""}
                    onSelect={() =>
                      isPro ? setProUpgradeField(field) : handleSelect(field)
                    }
                  >
                    <field.icon color={field.color} />
                    <span>{field.label}</span>
                    {isPro && (
                      <LockIcon className="ml-auto size-3 text-muted-foreground" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
    </>
  );
}
