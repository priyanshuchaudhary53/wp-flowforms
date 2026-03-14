import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import FormName from "./FormName";

export default function Header() {
  const formId = useFormStore((state) => state.formId);

  const isSetup = Number(formId) === 0;

  const closeHandler = () => {
    window.location.href = formflowData.adminFormsUrl;
  };

  return (
    <nav className="p-2 md:px-4 flex justify-between items-center h-14 bg-white border-b border-slate-200">
      <div className="flex items-center">
        <div className="text-gray-900 text-2xl font-semibold tracking-tight">
          WP FlowForms
        </div>
        {!isSetup && <FormName />}
      </div>
      <div className="">
        <button
          onClick={closeHandler}
          className="h-8 w-8 flex justify-center items-center rounded-sm text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <span className="sr-only">Exit</span>
          <XMarkIcon className="stroke-2" width={24} height={24} />
        </button>
      </div>
    </nav>
  );
}
