"use client";

import type { ResourceVisibility } from "@/lib/api/resources.types";
import { VISIBILITY_OPTIONS } from "./constants";
import { CoursePicker } from "./CoursePicker";

export function VisibilitySelector({
  visibility,
  onVisibilityChange,
  courseId,
  courseTitle,
  onCourseChange,
}: {
  visibility: ResourceVisibility;
  onVisibilityChange: (value: ResourceVisibility) => void;
  courseId: string | null;
  courseTitle?: string | null;
  onCourseChange: (courseId: string | null, courseTitle: string | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onVisibilityChange(opt.value)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors duration-150 cursor-pointer ${
              visibility === opt.value
                ? "border-[#2D6A4F] dark:border-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15"
                : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <span
              className={`text-sm font-bold ${
                visibility === opt.value
                  ? "text-[#2D6A4F] dark:text-[#52b788]"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {opt.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{opt.hint}</span>
          </button>
        ))}
      </div>

      {visibility === "COURSE_ENROLLED" && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Tied course <span className="text-red-500">*</span>
          </label>
          <CoursePicker value={courseId} valueLabel={courseTitle} onChange={onCourseChange} />
        </div>
      )}
    </div>
  );
}
