import { useFormStore } from "../store/useFormStore";

export default function Share({ className }) {
  const loading = useFormStore((state) => state.loading);

  if (loading) {
    return <div className={`flex-1 ${className}`}>{/* TODO: skeleton loader */}</div>;
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center text-gray-400">
        <p className="text-lg font-medium text-gray-500">Share</p>
        <p className="text-sm mt-1">Sharing and embed options will appear here.</p>
      </div>
    </div>
  );
}