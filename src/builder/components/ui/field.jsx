export default function Field({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  labelHidden = false,
  className = "",
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`block select-none text-base/7 font-medium text-gray-900 mb-2 ${labelHidden && 'sr-only'}`}
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border-0 bg-white px-3.5 py-2 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-400"
      />
    </div>
  );
}
