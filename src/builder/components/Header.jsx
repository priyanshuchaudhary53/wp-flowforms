import { XMarkIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import FormName from "./FormName";
import PreviewModal from "./PreviewModal";

export default function Header() {
  const formId       = useFormStore((s) => s.formId);
  const previewOpen  = useFormStore((s) => s.previewOpen);
  const setPreviewOpen = useFormStore((s) => s.setPreviewOpen);

  const isSetup = Number(formId) === 0;

  const closeHandler = () => {
    window.location.href = formflowData.adminFormsUrl;
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
          {/* Preview button — only shown when a real form is loaded */}
          {!isSetup && (
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-sm text-sm font-medium text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <EyeIcon width={16} height={16} className="stroke-2 shrink-0" />
              <span>Preview</span>
            </button>
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

      {/* Preview modal — rendered here so it sits above everything */}
      {!isSetup && (
        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
