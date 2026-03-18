import { useEffect, useRef, useState } from "react";
import DesignField from "../components/design/DesignField";
import DESIGN_SETTINGS from "../components/design/designSettings.jsx";
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
import ThemeGallery from "../components/design/ThemeGallery";
import { LayoutGridIcon } from "lucide-react";

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

  // Theme gallery visibility
  const [themeGalleryOpen, setThemeGalleryOpen] = useState(false);

  // Track whether a wp.media frame is open so we can block Sheet's outside-click close
  const mediaOpenRef = useRef(false);

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

  // ── Apply theme ──────────────────────────────────────────────────────
  // Writes all theme color keys into draftDesign, marking it dirty so
  // the canvas previews immediately and the save/discard buttons activate.
  const applyTheme = (theme) => {
    const COLOR_KEYS = [
      "bg_color", "title_color", "description_color", "answer_color",
      "button_color", "button_hover_color", "button_text_color",
      "hint_color", "star_color",
    ];
    COLOR_KEYS.forEach((key) => {
      if (theme[key]) updateDesign(key, theme[key]);
    });
  };

  return (
    <>
      {/* ── Design Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={designDrawerOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          onPointerDownOutside={(e) => { if (mediaOpenRef.current) e.preventDefault(); }}
          onInteractOutside={(e) => { if (mediaOpenRef.current) e.preventDefault(); }}
        >
          <SheetHeader>
            <SheetTitle>Design</SheetTitle>
            <SheetDescription>
              Customise colours, typography, and layout — or pick a theme to get started instantly
            </SheetDescription>
          </SheetHeader>

          <div className="grid flex-1 divide-y auto-rows-min px-4 overflow-y-auto no-scrollbar">
            {/* ── Theme gallery trigger ───────────────────────────────────── */}
            <div className="pb-5">
              <button
                type="button"
                onClick={() => setThemeGalleryOpen(true)}
                className="w-full cursor-pointer flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50"
              >
                <LayoutGridIcon width={16} height={16} className="stroke-2 shrink-0" />
                Open theme gallery
              </button>
            </div>

            {DESIGN_SETTINGS.map((section) => (
              <div key={section.section} className="py-6 first:pt-0 last:pb-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {section.section}
                </p>
                <div className="space-y-4">
                  {section.fields
                    // Hide the brightness slider when no global bg image is set
                    .filter((field) =>
                      field.type !== "brightness_slider" || draftDesign?.bg_image?.url
                    )
                    .map((field) => (
                      <DesignField
                        key={field.key}
                        field={field}
                        value={draftDesign?.[field.key]}
                        onChange={(val) => {
                          updateDesign(field.key, val);
                          if (field.type === "media_image" && val === null) {
                            updateDesign("bg_brightness", 0);
                          }
                        }}
                        onMediaOpen={() => { mediaOpenRef.current = true; }}
                        onMediaClose={() => { mediaOpenRef.current = false; }}
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
      {/* ── Theme gallery modal ──────────────────────────────────────── */}
      <ThemeGallery
        open={themeGalleryOpen}
        onOpenChange={setThemeGalleryOpen}
        onApply={applyTheme}
      />
    </>
  );
}