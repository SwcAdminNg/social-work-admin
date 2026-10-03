"use client";

import { Select } from "@/components/ui/select";

type Option = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

/** Kept for existing callers; renders the shared `Select`. */
export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  ariaLabel,
}: CustomDropdownProps) {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  );
}
