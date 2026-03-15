import { useEffect } from "react";
import { useFormStore } from "../store/useFormStore";
import LeftPanel from "../components/LeftPanel";
import CenterPanel from "../components/CenterPanel";
import RightPanel from "../components/RightPanel";
import AddBlockDialog from "../lookup/AddBlockDialog";
import DesignDrawer from "../lookup/DesignDrawer";

export default function Editor({ className }) {
  const form = useFormStore((state) => state.form);
  const loading = useFormStore((state) => state.loading);
  const error = useFormStore((state) => state.error);
  const fetchForm = useFormStore((state) => state.fetchForm);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  if (loading) {
    return <div className={className}>Loading form...</div>;
  }

  if (error) {
    return <div className={className}>⚠️ {error}</div>;
  }

  return (
    <>
      <div className={`grid grid-cols-12 2xl:flex overflow-hidden ${className}`}>
        <LeftPanel className="max-2xl:col-span-2 2xl:w-full 2xl:max-w-64" />
        <CenterPanel className="max-2xl:col-span-7 2xl:grow" />
        <RightPanel className="max-2xl:col-span-3 2xl:w-full 2xl:max-w-96" />
      </div>

      <AddBlockDialog />

      <DesignDrawer />
    </>
  );
}
