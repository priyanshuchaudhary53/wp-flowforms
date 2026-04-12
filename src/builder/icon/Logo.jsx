export default function Logo({ className, width = "25", height = "36" }) {
  return (
    <svg
      aria-label="hidden"
      width={width}
      height={height}
      className={className}
      viewBox="0 0 18 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 10C0 8.34315 1.34315 7 3 7H15C16.6569 7 18 8.34315 18 10V16C18 17.6569 16.6569 19 15 19H3C1.34315 19 0 17.6569 0 16V10Z"
        fill="#5B4EE8"
      />
      <path
        d="M0 2C0 0.895431 0.895431 0 2 0H16C17.1046 0 18 0.895431 18 2C18 3.10457 17.1046 4 16 4H2C0.89543 4 0 3.10457 0 2Z"
        fill="#5B4EE8"
        fill-opacity="0.5"
      />
      <path
        d="M0 24C0 22.8954 0.895431 22 2 22H16C17.1046 22 18 22.8954 18 24C18 25.1046 17.1046 26 16 26H2C0.89543 26 0 25.1046 0 24Z"
        fill="#5B4EE8"
        fill-opacity="0.5"
      />
    </svg>
  );
}
