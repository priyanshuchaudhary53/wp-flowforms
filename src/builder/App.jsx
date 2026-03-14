import Header from "./components/Header";
import Editor from "./page/Editor";
import Setup from "./page/Setup";
import { useFormStore } from "./store/useFormStore";

export default function App() {
  const formId = useFormStore((state) => state.formId);

  const isSetup = Number(formId) === 0;

  return (
    <div className="h-dvh overflow-hidden flex flex-col">
      <Header />
      {isSetup ? (
        <Setup className="grow" />
      ) : (
        <Editor className="grow" />
      )}
    </div>
  );
}
