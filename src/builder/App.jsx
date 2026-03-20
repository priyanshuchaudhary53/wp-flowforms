import Header from "./components/Header";
import { TooltipProvider } from "./components/ui/tooltip";
import Editor from "./page/Editor";
import Setup from "./page/Setup";
import { useFormStore } from "./store/useFormStore";

export default function App() {
  const formId = useFormStore((state) => state.formId);

  const isSetup = Number(formId) === 0;

  return (
    <TooltipProvider>
      <div className="h-dvh overflow-hidden flex flex-col">
        <Header />
        {isSetup ? <Setup className="grow" /> : <Editor className="flex-1" />}
      </div>
    </TooltipProvider>
  );
}
