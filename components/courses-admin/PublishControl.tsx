"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { publishCourse } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { archiveCourse, publishRevision, reinstateCourse } from "@/lib/api/governance-client";

export function PublishControl({
  course,
  canPublish,
  onPublished,
}: {
  course: Course;
  canPublish: boolean;
  onPublished: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !course.is_published;
    setLoading(true);
    try {
      const governance = "governance" in course ? (course as Course & { governance?: { governance_enabled?: boolean; open_revision?: { id: string } | null } }).governance : undefined;
      if (governance?.governance_enabled) {
        if (course.governance_status === "ARCHIVED") {
          const reason = window.prompt("Reason for reinstating this course?") ?? undefined;
          await reinstateCourse(course.id, reason);
          toast.success("Reinstatement revision created.");
        } else if (course.is_published) {
          const reason = window.prompt("Reason for archiving this course?") ?? undefined;
          await archiveCourse(course.id, reason);
          toast.success("Course archived.");
        } else if (governance.open_revision?.id) {
          await publishRevision(governance.open_revision.id);
          toast.success("Approved revision published.");
        } else {
          await publishCourse(course.id, next);
          toast.success("Course publish requested.");
        }
      } else {
        await publishCourse(course.id, next);
        toast.success(next ? "Course published." : "Course unpublished.");
      }
      onPublished();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update publish status."
      );
    } finally {
      setLoading(false);
    }
  }

  const governance = "governance" in course ? (course as Course & { governance?: { governance_enabled?: boolean; open_revision?: { id: string } | null } }).governance : undefined;
  const disabled = loading || (!course.is_published && course.governance_status !== "ARCHIVED" && !governance?.open_revision?.id && !canPublish);
  const label =
    governance?.governance_enabled && course.governance_status === "ARCHIVED"
      ? "Reinstate"
      : governance?.governance_enabled && course.is_published
        ? "Archive"
        : course.is_published
          ? "Unpublish"
          : "Publish";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={!course.is_published && !canPublish ? "Add at least one curriculum item before publishing" : undefined}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        course.is_published
          ? "text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ink-line hover:bg-slate-100 dark:hover:bg-slate-800"
          : "text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-green-900/20"
      }`}
    >
      {loading && <IconSpinner className={course.is_published ? "text-slate-500" : "text-white/80"} />}
      {label}
    </button>
  );
}
