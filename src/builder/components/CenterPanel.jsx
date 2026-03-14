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
    <div className={`px-1.5 py-3 flex flex-col gap-3 ${className}`}>
      <div className="p-2 shrink-0 rounded-2xl md:px-4 h-14 bg-gray-100 flex items-center">
        <div className="flex items-center">
          <div>
            <button
              onClick={setAddBlockDialogOpen}
              className="flex items-center gap-1 rounded-md cursor-pointer bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-gray-900"
            >
              <PlusIcon className="stroke-2 -ml-0.5" width={16} height={16} />
              <span>Add block</span>
            </button>
          </div>
          <div className="pl-4 ml-4 border-l border-gray-300">
            <button
              onClick={setDesignDrawerOpen}
              className="flex items-center text-sm gap-1.5 text-gray-500 cursor-pointer hover:text-gray-600"
            >
              <SwatchIcon className="stroke-1.5" width={16} height={16} />
              <span>Design</span>
            </button>
          </div>
        </div>
      </div>
      <Canvas />
    </div>
  );
}
