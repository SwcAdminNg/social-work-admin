"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteCourse, getManagedCourse } from "@/lib/api/courses-client";
import type { CourseDetail } from "@/lib/api/courses.types";
import { IconTrash } from "@/components/dashboard/icons";
import { courseEditorReducer, hasAnyCurriculumItem } from "./courseEditorReducer";
import { PublishedBadge } from "./StatusBadge";
import { PublishControl } from "./PublishControl";
import { ConfirmDialog } from "./ConfirmDialog";
import { CourseDetailsTab } from "./CourseDetailsTab";
import { CourseCurriculumTab } from "./CourseCurriculumTab";

const VIDEO_POLL_INTERVAL_MS = 5000;

type Tab = "details" | "curriculum";

export function CourseEditor({ initialCourse }: { initialCourse: CourseDetail }) {
  const router = useRouter();
  const [course, dispatch] = useReducer(courseEditorReducer, initialCourse);
  const [tab, setTab] = useState<Tab>("details");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const courseRef = useRef(course);
  useEffect(() => {
    courseRef.current = course;
  }, [course]);

  const hasPendingVideo = course.sections.some((s) =>
    s.items.some((i) => i.video && (i.video.status === "PENDING" || i.video.status === "PROCESSING"))
  );

  useEffect(() => {
    if (!hasPendingVideo) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await getManagedCourse(courseRef.current.id);
        dispatch({ type: "SET_COURSE", course: fresh });
      } catch {
        // Silent failure — manual refresh button remains available.
      }
    }, VIDEO_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPendingVideo]);

  async function refreshCourse() {
    try {
      const fresh = await getManagedCourse(course.id);
      dispatch({ type: "SET_COURSE", course: fresh });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to refresh course.");
    }
  }

  async function handleDeleteCourse() {
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      toast.success("Course deleted.");
      router.push("/dashboard/course-management");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete course.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/course-management"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Course Management
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
            {course.title}
          </h1>
          <PublishedBadge isPublished={course.is_published} />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <PublishControl
            course={course}
            canPublish={hasAnyCurriculumItem(course)}
            onPublished={(fields) => dispatch({ type: "UPDATE_COURSE_FIELDS", fields })}
          />
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            aria-label="Delete course"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start">
        {([
          { key: "details", label: "Details" },
          { key: "curriculum", label: "Curriculum" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              tab === key
                ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <CourseDetailsTab
          course={course}
          onUpdated={(fields) => dispatch({ type: "UPDATE_COURSE_FIELDS", fields })}
        />
      ) : (
        <CourseCurriculumTab course={course} dispatch={dispatch} onRefresh={refreshCourse} />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this course?"
        description={`"${course.title}" and its entire curriculum will be removed from listings.`}
        loading={deleting}
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
