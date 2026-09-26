import { useState } from "react";

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a13.5 13.5 0 0 1-3.1 3.9M6.6 6.6C4 8.3 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={`${className} pr-10`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-clay-400 hover:text-clay-600"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon className="w-4.5 h-4.5" /> : <EyeIcon className="w-4.5 h-4.5" />}
      </button>
    </div>
  );
}
