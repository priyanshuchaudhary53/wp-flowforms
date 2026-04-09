import { __ } from '@wordpress/i18n';
import { PlusIcon, SwatchIcon } from "@heroicons/react/24/outline";
import { useFormStore } from "../store/useFormStore";
import Canvas from "./Canvas";

export default function CenterPanel({ className }) {
  const setAddBlockDialogOpen = useFormStore(
    (state) => state.setAddBlockDialogOpen,
  );
  const setDesignDrawerOpen = useFormStore(
    (state) => state.setDesignDrawerOpen,
  );

  return (
    <div className={`px-1.5 py-3 flex flex-col gap-3 min-h-0 ${className}`}>
      <div className="p-2 shrink-0 rounded-2xl md:px-4 h-14 bg-white flex items-center">
        <div className="flex items-center">
          <div>
            <button
              onClick={setAddBlockDialogOpen}
              className="flex items-center gap-1 rounded-md cursor-pointer bg-ff-primary-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-ff-primary-600"
            >
              <PlusIcon className="stroke-2 -ml-0.5" width={16} height={16} />
              <span>{ __( 'Add block', 'flowforms' ) }</span>
            </button>
          </div>
          <div className="pl-4 ml-4 border-l border-gray-300">
            <button
              onClick={setDesignDrawerOpen}
              className="flex items-center text-sm gap-1.5 text-gray-500 cursor-pointer hover:text-gray-600"
            >
              <SwatchIcon className="stroke-1.5" width={16} height={16} />
              <span>{ __( 'Design', 'flowforms' ) }</span>
            </button>
          </div>
        </div>
      </div>
      <Canvas />
    </div>
  );
}
