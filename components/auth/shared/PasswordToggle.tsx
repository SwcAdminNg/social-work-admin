"use client";

import { IconEyeClosed, IconEyeOpen } from "./icons";

export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="text-gray-400 dark:text-gray-500 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#52b788] rounded p-0.5"
    >
      {visible ? <IconEyeClosed /> : <IconEyeOpen />}
    </button>
  );
}
