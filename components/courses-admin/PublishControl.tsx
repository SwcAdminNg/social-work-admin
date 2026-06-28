"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { publishCourse } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { IconSpinner } from "@/components/dashboard/icons";

export function PublishControl({
  course,
  canPublish,
  onPublished,
}: {
  course: Course;
  canPublish: boolean;
  onPublished: (fields: Partial<Course>) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !course.is_published;
    setLoading(true);
    try {
      const updated = await publishCourse(course.id, next);
      onPublished(updated);
      toast.success(next ? "Course published." : "Course unpublished.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update publish status."
      );
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || (!course.is_published && !canPublish);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={!course.is_published && !canPublish ? "Add at least one curriculum item before publishing" : undefined}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        course.is_published
          ? "text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
          : "text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20"
      }`}
    >
      {loading && <IconSpinner className={course.is_published ? "text-gray-500" : "text-white/80"} />}
      {course.is_published ? "Unpublish" : "Publish"}
    </button>
  );
}
