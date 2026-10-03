"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

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
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={ariaLabel}
          className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-400/15 data-[state=open]:border-brand-400 dark:border-ink-line dark:bg-ink-page/60 dark:text-white"
        >
          <span className={`truncate ${selectedOption ? "" : "text-slate-400"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-[70] max-h-80 min-w-[var(--radix-dropdown-menu-trigger-width)] animate-pop-in overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_48px_-16px_rgba(15,23,42,0.35)] dark:border-ink-line dark:bg-ink-raised"
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:text-brand-700 dark:text-slate-200 dark:data-[highlighted]:bg-white/8 dark:data-[state=checked]:text-brand-300"
              >
                {option.label}
                <DropdownMenu.ItemIndicator>
                  <Check className="h-4 w-4" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
