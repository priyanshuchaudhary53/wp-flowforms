import { useState } from "react";
import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { RocketLaunchIcon, CheckIcon, ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import FormName from "./FormName";
import PreviewModal from "./PreviewModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function Header() {
  const formId         = useFormStore((s) => s.formId);
  const previewOpen    = useFormStore((s) => s.previewOpen);
  const setPreviewOpen = useFormStore((s) => s.setPreviewOpen);
  const hasDraft       = useFormStore((s) => s.hasDraft);
  const hasPublished   = useFormStore((s) => s.hasPublished);
  const publishForm    = useFormStore((s) => s.publishForm);
  const revertForm     = useFormStore((s) => s.revertForm);

  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [publishing, setPublishing]             = useState(false);
  const [reverting, setReverting]               = useState(false);

  const isSetup = Number(formId) === 0;

  const closeHandler = () => {
    window.location.href = formflowData.adminFormsUrl;
  };

  const handlePublish = async () => {
    if (!hasDraft || publishing) return;
    setPublishing(true);
    try {
      await publishForm();
    } catch (err) {
      // publishForm logs internally; nothing extra needed here.
    } finally {
      setPublishing(false);
    }
  };

  const handleRevertConfirm = async () => {
    setReverting(true);
    try {
      await revertForm();
      setRevertDialogOpen(false);
    } catch (err) {
      // revertForm logs internally.
    } finally {
      setReverting(false);
    }
  };

  return (
    <>
      <nav className="p-2 md:px-4 flex justify-between items-center h-14 bg-white border-b border-slate-200">
        <div className="flex items-center">
          <div className="text-gray-900 text-2xl font-semibold tracking-tight">
            WP FlowForms
          </div>
          {!isSetup && <FormName />}
        </div>

        <div className="flex items-center gap-2">
          {!isSetup && (
            <>
              {/* Preview */}
              <button
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <EyeIcon width={16} height={16} className="stroke-2 shrink-0" />
                <span>Preview</span>
              </button>

              {/* Revert — only visible when a draft exists AND a published version to go back to */}
              {hasDraft && hasPublished && (
                <button
                  onClick={() => setRevertDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <ArrowUturnLeftIcon
                    width={16}
                    height={16}
                    className="stroke-2 shrink-0"
                  />
                  <span>Revert</span>
                </button>
              )}

              {/* Publish / Published */}
              {hasDraft ? (
                // Active state — draft exists and differs from published
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium bg-gray-900 text-white cursor-pointer transition-colors hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RocketLaunchIcon
                    width={15}
                    height={15}
                    className="stroke-2 shrink-0"
                  />
                  <span>{publishing ? "Publishing…" : "Publish"}</span>
                </button>
              ) : (
                // Inactive state — no draft, form is up to date
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed select-none"
                >
                  <CheckIcon
                    width={15}
                    height={15}
                    className="stroke-2 shrink-0"
                  />
                  <span>Published</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={closeHandler}
            className="h-8 w-8 flex justify-center items-center rounded-sm text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="sr-only">Exit</span>
            <XMarkIcon className="stroke-2" width={24} height={24} />
          </button>
        </div>
      </nav>

      {/* Preview modal */}
      {!isSetup && (
        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Revert confirmation dialog */}
      <Dialog
        open={revertDialogOpen}
        onOpenChange={(open) => {
          if (!reverting) setRevertDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="leading-normal">
              Are you sure you want to revert to previous published state?
            </DialogTitle>
            <DialogDescription>
              All your current changes (including design changes) will be
              discarded. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevertDialogOpen(false)}
              disabled={reverting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevertConfirm}
              disabled={reverting}
            >
              {reverting ? "Reverting…" : "Yes, revert my form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
