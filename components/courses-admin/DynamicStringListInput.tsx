"use client";

import { useState } from "react";
import { IconPlus, IconTrash } from "@/components/dashboard/icons";

interface DynamicStringListInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export function DynamicStringListInput({
  label,
  placeholder,
  values,
  onChange,
}: DynamicStringListInputProps) {
  const [draft, setDraft] = useState("");

  function addValue() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...values, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex flex-col gap-2 mb-2">
        {values.map((value, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-2"
          >
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{value}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={`Remove ${value}`}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
        <button
          type="button"
          onClick={addValue}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 cursor-pointer"
        >
          <IconPlus />
          Add
        </button>
      </div>
    </div>
  );
}
