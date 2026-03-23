import { useFormStore } from "../store/useFormStore";
import LeftPanel from "../components/LeftPanel";
import CenterPanel from "../components/CenterPanel";
import RightPanel from "../components/RightPanel";
import AddBlockDialog from "../lookup/AddBlockDialog";
import DesignDrawer from "../lookup/DesignDrawer";

export default function Editor({ className }) {
  const loading = useFormStore((state) => state.loading);

  if (loading) {
    return <div className={`flex-1 ${className}`}>{/* TODO: skeleton loader */}</div>;
  }

  return (
    <>
      <div className={`bg-ff-surface grid grid-cols-12 2xl:flex overflow-hidden ${className}`}>
        <LeftPanel className="max-2xl:col-span-2 2xl:w-full 2xl:max-w-64" />
        <CenterPanel className="max-2xl:col-span-7 2xl:grow" />
        <RightPanel className="max-2xl:col-span-3 2xl:w-full 2xl:max-w-96" />
      </div>

      <AddBlockDialog />

      <DesignDrawer />
    </>
  );
}
