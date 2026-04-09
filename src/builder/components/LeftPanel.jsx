import { __ } from '@wordpress/i18n';
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
    <div className={`p-3 pr-1.5 min-h-0 ${className}`}>
      <div className="flex flex-col rounded-2xl px-3 pt-6 pb-4 h-full bg-white overflow-y-auto">
        {welcomeScreen && (
          <div className="shrink-0">
            <p className="text-xs/5 text-gray-600">{ __( 'Welcome page', 'flowforms' ) }</p>
            <div className="mt-2">
              <ScreenButton
                title={welcomeScreen.content?.title}
                type="welcome"
              />
            </div>
          </div>
        )}

        <div className="mt-10 min-h-0 flex flex-col">
          <BlockList
            questions={questions}
            onAddClick={() => setAddBlockDialogOpen(true)}
          />
        </div>

        {thankYouScreen && (
          <div className="mt-10 shrink-0">
            <p className="text-xs/5 text-gray-600">{ __( 'Thank you page', 'flowforms' ) }</p>
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
