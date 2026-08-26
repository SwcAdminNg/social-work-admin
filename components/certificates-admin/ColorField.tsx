"use client";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function ColorField({
  label,
  id,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  disabled?: boolean;
}) {
  const isValid = HEX_PATTERN.test(value);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={isValid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-10 h-10 flex-shrink-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent cursor-pointer p-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#0B3D2E"
          maxLength={7}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] ${
            isValid
              ? "border-gray-200 dark:border-gray-800"
              : "border-red-300 dark:border-red-800"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-600">{hint}</p>}
      {!isValid && (
        <p className="mt-1.5 text-xs text-red-500">Must be a 7-character hex color, e.g. #0B3D2E.</p>
      )}
    </div>
  );
}
