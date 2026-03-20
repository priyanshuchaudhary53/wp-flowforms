import { useEffect } from "react";
import Header from "./components/Header";
import { TooltipProvider } from "./components/ui/tooltip";
import Editor from "./page/Editor";
import Setup from "./page/Setup";
import Settings from "./page/Settings";
import Share from "./page/Share";
import { useFormStore } from "./store/useFormStore";

export default function App() {
  const formId    = useFormStore((state) => state.formId);
  const error     = useFormStore((state) => state.error);
  const fetchForm = useFormStore((state) => state.fetchForm);

  const isSetup = Number(formId) === 0;
  const view    = formflowData.view ?? "builder";

  // Fetch the form once at app level so all views — Builder, Settings, Share —
  // have access to form data and the header can show the correct publish state.
  useEffect(() => {
    if (!isSetup) fetchForm();
  }, [fetchForm, isSetup]);

  return (
    <TooltipProvider>
      <div className="h-dvh overflow-hidden flex flex-col">
        <Header />

        {isSetup ? (
          <Setup className="grow" />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-sm text-red-500">
            ⚠️ {error}
          </div>
        ) : (
          <>
            {view === "builder"  && <Editor    className="flex-1" />}
            {view === "settings" && <Settings  className="flex-1" />}
            {view === "share"    && <Share     className="flex-1" />}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
