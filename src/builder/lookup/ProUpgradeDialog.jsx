import { LockIcon } from "lucide-react";
import { __ } from "@wordpress/i18n";
import { getProUrl } from "../config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function ProUpgradeDialog({ field, onClose }) {
  return (
    <Dialog open={!!field} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs text-center" showCloseButton={true}>
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <LockIcon className="size-6" />
          </div>
          <DialogHeader className="items-center">
            <DialogTitle>
              {field?.label} {__("is a Pro feature", "flowforms")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {__(
                "Unlock advanced fields and more powerful features by upgrading to FlowForms Pro.",
                "flowforms",
              )}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            className="w-full bg-amber-500 hover:bg-amber-600! text-white border-0"
            asChild
          >
            <a href={getProUrl(`pro-field-${field?.type}`)} target="_blank" rel="noopener noreferrer">
              {__("Upgrade to Pro", "flowforms")}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
