import { useFormStore } from "../../store/useFormStore";

const SCREEN_COLORS = {
  welcome: { color: "#0EA5E9", label: "Welcome page" },
  thankYou: { color: "#22C55E", label: "Thank you page" },
};

export default function ScreenButton({ title, type }) {
  const { color } = SCREEN_COLORS[type];

  const selectedBlock = useFormStore((state) => state.selectedBlock);
  const setSelectedBlock = useFormStore((state) => state.setSelectedBlock);

  const isSelected = selectedBlock?.type === type;

  return (
    <button
      onClick={() => setSelectedBlock({ id: type, type })}
      className={[
        "w-full p-2 h-10 relative flex items-center gap-2 text-xs rounded-md border-2 border-transparent cursor-pointer transition-all",
        isSelected
          ? "border-dashed"
          : "hover:brightness-95",
      ].join(" ")}
      style={{
        backgroundColor: color + "50",
        ...(isSelected
          ? { borderColor: color, outlineColor: color }
          : {}),
      }}
    >
      <div
        className="ml-1 w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <p className="truncate text-gray-900" tyle={{ color }}>
        {title}
      </p>
    </button>
  );
}
