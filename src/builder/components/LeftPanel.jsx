import { useFormStore } from "../store/useFormStore";
import BlockList from "./left-panel/BlockList";
import ScreenButton from "./left-panel/ScreenButton";

export default function LeftPanel({ className }) {
  const setAddBlockDialogOpen = useFormStore(
    (state) => state.setAddBlockDialogOpen,
  );

  const form = useFormStore((state) => state.form);
  const welcomeScreen = form?.content?.welcomeScreen;
  const thankYouScreen = form?.content?.thankYouScreen;
  const questions = form?.content?.questions;

  return (
    <div className={`p-3 pr-1.5 ${className}`}>
      <div className="space-y-10 rounded-2xl px-3 pt-6 h-full bg-gray-100">
        {welcomeScreen && (
          <div>
            <p className="text-xs/5 text-gray-600">Welcome page</p>
            <div className="mt-2">
              <ScreenButton
                title={welcomeScreen.content?.title}
                type="welcome"
              />
            </div>
          </div>
        )}

        <BlockList
          questions={questions}
          onAddClick={() => setAddBlockDialogOpen(true)}
        />

        {thankYouScreen && (
          <div>
            <p className="text-xs/5 text-gray-600">Thank you page</p>
            <div className="mt-2">
              <ScreenButton
                title={thankYouScreen.content?.title}
                type="thankYou"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
