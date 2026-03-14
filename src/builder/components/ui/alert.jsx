export default function Alert({ className, type = "error", message }) {
  return (
    <div
      className={`rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 ${className}`}
    >{message}</div>
  );
}
