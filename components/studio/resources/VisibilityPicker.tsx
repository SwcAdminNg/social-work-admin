"use client";

import { ChoiceCard, Field } from "@/components/ui/primitives";
import { CoursePicker } from "@/components/resources-admin/CoursePicker";
import type { ResourceVisibility } from "@/lib/api/resources.types";
import { VISIBILITY_META } from "./resourceMeta";

/** Who can open a resource, plus the tied course for course-only resources. */
export function VisibilityPicker({
  visibility,
  courseId,
  courseTitle,
  onVisibility,
  onCourse,
  courseError,
  disabled,
}: {
  visibility: ResourceVisibility;
  courseId: string | null;
  courseTitle: string | null;
  onVisibility: (v: ResourceVisibility) => void;
  onCourse: (id: string | null, title: string | null) => void;
  courseError?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 md:grid-cols-3">
        {(Object.keys(VISIBILITY_META) as ResourceVisibility[]).map((v) => {
          const meta = VISIBILITY_META[v];
          return (
            <ChoiceCard
              key={v}
              icon={meta.icon}
              tone={meta.tone}
              title={meta.label}
              description={meta.hint}
              selected={visibility === v}
              disabled={disabled}
              onClick={() => onVisibility(v)}
            />
          );
        })}
      </div>
      {visibility === "COURSE_ENROLLED" && (
        <Field
          label="Tied course"
          required
          error={courseError}
          hint="Only people with access to this course (plus admins and its instructors) can open the resource."
        >
          <CoursePicker value={courseId} valueLabel={courseTitle} onChange={onCourse} />
        </Field>
      )}
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        The name, description and cover are always visible in listings; visibility controls who can open the attachments.
      </p>
    </div>
  );
}
