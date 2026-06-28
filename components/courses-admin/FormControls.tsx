"use client";

function FieldWrapper({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-600">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] disabled:opacity-60 disabled:cursor-not-allowed";

interface BaseFieldProps {
  label: string;
  id: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TextField({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  hint,
  disabled,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <FieldWrapper label={label} htmlFor={id} hint={hint} required={required}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputClass}
      />
    </FieldWrapper>
  );
}

export function TextAreaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  hint,
  rows = 4,
  disabled,
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <FieldWrapper label={label} htmlFor={id} hint={hint} required={required}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        disabled={disabled}
        className={`${inputClass} resize-none`}
      />
    </FieldWrapper>
  );
}

export function SelectField<T extends string>({
  label,
  id,
  value,
  onChange,
  options,
  required,
  hint,
  disabled,
}: BaseFieldProps & {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <FieldWrapper label={label} htmlFor={id} hint={hint} required={required}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        required={required}
        disabled={disabled}
        className={inputClass}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-6 flex-shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-[#2D6A4F] dark:bg-[#52b788]" : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {hint && <span className="block text-xs text-gray-400 dark:text-gray-600 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}
