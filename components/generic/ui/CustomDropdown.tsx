"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconChevronDown } from "@/components/dashboard/icons";

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

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  ariaLabel,
}: CustomDropdownProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className="flex items-center justify-between w-full px-3 py-2 text-sm text-left bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 dark:focus:ring-[#52b788]"
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <IconChevronDown />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-56 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg"
          sideOffset={5}
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 outline-none"
              >
                {option.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
