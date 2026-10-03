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
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Visibility</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onVisibilityChange(opt.value)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors duration-150 cursor-pointer ${
              visibility === opt.value
                ? "border-brand-600 dark:border-brand-400 bg-brand-600/10 dark:bg-brand-400/15"
                : "border-slate-200 dark:border-ink-line hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span
              className={`text-sm font-bold ${
                visibility === opt.value
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              {opt.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{opt.hint}</span>
          </button>
        ))}
      </div>

      {visibility === "COURSE_ENROLLED" && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Tied course <span className="text-red-500">*</span>
          </label>
          <CoursePicker value={courseId} valueLabel={courseTitle} onChange={onCourseChange} />
        </div>
      )}
    </div>
  );
}
