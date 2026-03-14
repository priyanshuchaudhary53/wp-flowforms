import { useEffect, useRef, useState } from "react";
import DesignField from "../components/design/DesignField";
import DESIGN_SETTINGS from "../components/design/designSettings";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useFormStore } from "../store/useFormStore";

// ── Shake animation style (injected once) ────────────────────────────────────
const SHAKE_STYLE = `
@keyframes ff-shake {
  0%   { transform: translateX(0); }
  15%  { transform: translateX(-5px); }
  30%  { transform: translateX(5px); }
  45%  { transform: translateX(-4px); }
  60%  { transform: translateX(4px); }
  75%  { transform: translateX(-2px); }
  90%  { transform: translateX(2px); }
  100% { transform: translateX(0); }
}
.ff-shake { animation: ff-shake 0.45s ease; }
`;

export default function DesignDrawer() {
  const draftDesign     = useFormStore((state) => state.draftDesign);
  const designDirty     = useFormStore((state) => state.designDirty);
  const updateDesign    = useFormStore((state) => state.updateDesign);
  const commitDesign    = useFormStore((state) => state.commitDesign);
  const discardDesign   = useFormStore((state) => state.discardDesign);
  const designDrawerOpen    = useFormStore((state) => state.designDrawerOpen);
  const setDesignDrawerOpen = useFormStore((state) => state.setDesignDrawerOpen);

  // Which confirm dialog is open: null | "save" | "discard"
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Footer ref for shake animation
  const footerRef = useRef(null);

  // Inject shake keyframes once
  useEffect(() => {
    const id = "ff-shake-style";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = SHAKE_STYLE;
      document.head.appendChild(tag);
    }
  }, []);
  
  // ── Shake the footer buttons ──────────────────────────────────────────────
  const shakeFooter = () => {
    const el = footerRef.current;
    console.log('test');
    if (!el) return;
    el.classList.remove("ff-shake");
    // Force reflow so re-adding the class triggers the animation again
    void el.offsetWidth;
    el.classList.add("ff-shake");
  };
  
  // ── Intercept Sheet's onOpenChange ────────────────────────────────────────
  // Radix fires onOpenChange(false) for BOTH the overlay click and the
  // built-in ✕ close button. We block it when there are unsaved changes
  // and shake the footer instead.
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && designDirty) {
      // Block close — shake footer to draw attention
      shakeFooter();
      return;
    }
    setDesignDrawerOpen(nextOpen);
  };

  // ── Save flow ─────────────────────────────────────────────────────────────
  const handleSaveClick = () => {
    setConfirmDialog("save");
  };

  const handleSaveConfirm = () => {
    commitDesign();
    setConfirmDialog(null);
    setDesignDrawerOpen(false);
  };

  // ── Close / discard flow ──────────────────────────────────────────────────
  const handleCloseClick = () => {
    if (designDirty) {
      setConfirmDialog("discard");
    } else {
      setDesignDrawerOpen(false);
    }
  };

  const handleDiscardConfirm = () => {
    discardDesign();          // reverts canvas, closes drawer
    setConfirmDialog(null);
  };

  return (
    <>
      {/* ── Design Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={designDrawerOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="left" showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Design</SheetTitle>
            <SheetDescription>
              Customise the look of your form. Save when you&apos;re happy with the
              preview.
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 divide-y auto-rows-min px-4 overflow-y-auto no-scrollbar">
            {DESIGN_SETTINGS.map((section) => (
              <div key={section.section} className="py-6 first:pt-0 last:pb-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.section}
                </p>
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <DesignField
                      key={field.key}
                      field={field}
                      value={draftDesign?.[field.key]}
                      onChange={(val) => updateDesign(field.key, val)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <SheetFooter
            ref={footerRef}
            className="flex flex-row items-center gap-2 justify-end"
          >
            <Button variant="outline" size="lg" onClick={handleCloseClick}>
              Close
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={!designDirty}
              onClick={handleSaveClick}
            >
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Save confirm dialog ───────────────────────────────────────────── */}
      <Dialog
        open={confirmDialog === "save"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Publish design changes?</DialogTitle>
            <DialogDescription>
              These changes will immediately reflect in your published form.
              Proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
            >
              No, go back
            </Button>
            <Button onClick={handleSaveConfirm}>Yes, save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Discard confirm dialog ────────────────────────────────────────── */}
      <Dialog
        open={confirmDialog === "discard"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard design changes?</DialogTitle>
            <DialogDescription>
              Are you sure you want to discard all unsaved design changes? The
              canvas will revert to the last saved state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(null)}
            >
              No, keep editing
            </Button>
            <Button variant="destructive" onClick={handleDiscardConfirm}>
              Yes, discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}