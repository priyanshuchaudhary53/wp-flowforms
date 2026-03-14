import { useEffect, useState } from "react";
import { PencilIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import Field from "./ui/field";
import Alert from "./ui/alert";

export default function FormName() {
  const form = useFormStore((state) => state.form);
  const renameForm = useFormStore((state) => state.renameForm);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync input when dialog opens
  useEffect(() => {
    if (open) {
      setName(form?.title ?? "");
      setError(null);
    }
  }, [open, form?.title]);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);

    try {
      await renameForm(trimmed);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ml-4 pl-4 border-l border-gray-200">
      <h1 className="group flex items-center gap-1 text-gray-600 underline-offset-4">
        <span className="max-w-xs block truncate">{form?.title}</span>
        <div className="opacity-0 shrink-0 transition-opacity ease-out group-hover:opacity-100">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="w-6 h-6 flex text-gray-600 items-center justify-center cursor-pointer rounded-md transition-colors hover:text-gray-900 hover:bg-gray-100">
                <span className="sr-only">Edit form name</span>
                <PencilIcon width={14} height={14} />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename form</DialogTitle>
              </DialogHeader>
              <Field
                label="Rename your form"
                labelHidden={true}
                id="form-name"
                name="form-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                placeholder="Enter your form name here..."
              />
              {error && <Alert type="error" message={error} />}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="lg">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleRename}
                  disabled={saving || !name.trim()}
                  size="lg"
                >
                  {saving ? "Saving..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </h1>
    </div>
  );
}
