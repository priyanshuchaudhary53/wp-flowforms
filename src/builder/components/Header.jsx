import { useState } from "react";
import { __ } from '@wordpress/i18n';
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
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import Logo from "../icon/Logo";

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

  const isSetup      = Number(formId) === 0;
  const currentView  = flowformsBuilderData.view ?? "builder";

  // Build a URL for a given view, preserving form_id
  const viewUrl = (v) =>
    `${flowformsBuilderData.builderUrl}&form_id=${formId}&view=${v}`;

  const TABS = [
    { id: "builder",  label: __( 'Builder', 'flowforms' )  },
    { id: "settings", label: __( 'Settings', 'flowforms' ) },
    { id: "share",    label: __( 'Share', 'flowforms' )    },
  ];

  const closeHandler = () => {
    window.location.href = flowformsBuilderData.adminFormsUrl;
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
        {/* ── Left: logo + form name ─────────────────────────────────── */}
        <div className="flex items-center min-w-0 flex-1">
          <div>
            <Logo />
            <span className="sr-only">{ __( 'FlowForms', 'flowforms' ) }</span>
          </div>
          {!isSetup && <FormName />}
        </div>

        {/* ── Centre: view tabs ──────────────────────────────────────── */}
        {!isSetup && (
          <div className="flex items-center bg-gray-100 gap-1 p-1 rounded-lg">
            {TABS.map((tab) => (
              <a
                key={tab.id}
                href={viewUrl(tab.id)}
                className={[
                  "px-3.5 h-8 inline-flex items-center rounded-md text-sm font-medium transition-colors",
                  currentView === tab.id
                    ? "bg-white text-gray-900"
                    : "text-gray-600 hover:bg-white hover:text-gray-900",
                ].join(" ")}
              >
                {tab.label}
              </a>
            ))}
          </div>
        )}

        {/* ── Right: action buttons ──────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {!isSetup && (
            <>
              {/* Preview */}
              <button
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium bg-ff-secondary-100 text-ff-secondary-700 cursor-pointer transition-colors hover:bg-ff-secondary-200"
              >
                <EyeIcon width={16} height={16} className="stroke-2 shrink-0" />
                <span>{ __( 'Preview', 'flowforms' ) }</span>
              </button>

              {/* Revert — only visible when a draft exists AND a published version to go back to */}
              {hasDraft && hasPublished && (
                <button
                  onClick={() => setRevertDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium text-red-700 bg-red-100 cursor-pointer transition-colors hover:bg-red-200"
                >
                  <ArrowUturnLeftIcon
                    width={16}
                    height={16}
                    className="stroke-2 shrink-0"
                  />
                  <span>{ __( 'Revert', 'flowforms' ) }</span>
                </button>
              )}

              {/* Publish / Published */}
              {hasDraft ? (
                // Active state — draft exists and differs from published
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium bg-ff-primary-500 text-white cursor-pointer transition-colors hover:bg-ff-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <RocketLaunchIcon
                        width={15}
                        height={15}
                        className="stroke-2 shrink-0"
                      />
                      <span>{publishing ? __( 'Publishing…', 'flowforms' ) : __( 'Publish', 'flowforms' )}</span>
                    </button>
                  </TooltipTrigger>
                  {!publishing && (
                    <TooltipContent className="pointer-events-none">
                      <p>{ __( 'Make your changes live', 'flowforms' ) }</p>
                    </TooltipContent>
                  )}
                </Tooltip>
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
                  <span>{ __( 'Published', 'flowforms' ) }</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={closeHandler}
            className="h-8 w-8 flex justify-center items-center rounded-sm text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="sr-only">{ __( 'Exit', 'flowforms' ) }</span>
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
              { __( 'Are you sure you want to revert to previous published state?', 'flowforms' ) }
            </DialogTitle>
            <DialogDescription>
              { __( 'All your current changes (excluding design changes) will be discarded. This action is irreversible.', 'flowforms' ) }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevertDialogOpen(false)}
              disabled={reverting}
            >
              { __( 'Cancel', 'flowforms' ) }
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevertConfirm}
              disabled={reverting}
            >
              {reverting ? __( 'Reverting…', 'flowforms' ) : __( 'Yes, revert my form', 'flowforms' )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
