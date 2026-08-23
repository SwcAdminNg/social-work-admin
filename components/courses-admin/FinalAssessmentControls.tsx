"use client";

import { IconLock } from "@/components/dashboard/icons";

export function FinalAssessmentToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none sm:col-span-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#2D6A4F] mt-0.5"
      />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Final assessment for this section
        <span className="block text-[0.7rem] font-normal text-gray-400 dark:text-gray-600 mt-0.5">
          Students must pass this before the next section unlocks. Exhausting retries without
          passing resets the section (or the whole course, if this is the last section).
        </span>
      </span>
    </label>
  );
}

export function FinalAssessmentBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 [&_svg]:w-3 [&_svg]:h-3">
      <IconLock />
      Final
    </span>
  );
}
