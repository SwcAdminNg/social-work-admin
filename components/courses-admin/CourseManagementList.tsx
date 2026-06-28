"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteCourse, listManagedCourses } from "@/lib/api/courses-client";
import type { Course, ManagedCourseListParams, PaginatedResult } from "@/lib/api/courses.types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconBookOpen, IconPlus } from "@/components/dashboard/icons";
import { CourseCard } from "./CourseCard";
import { CourseFilters } from "./CourseFilters";
import { ConfirmDialog } from "./ConfirmDialog";

type Tab = "all" | "published" | "draft";

interface CourseManagementListProps {
  initialData: PaginatedResult<Course>;
}

export function CourseManagementList({ initialData }: CourseManagementListProps) {
  const [result, setResult] = useState(initialData);
  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<Pick<ManagedCourseListParams, "search" | "category" | "level" | "is_free">>(
    {}
  );
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchWith(next: { tab?: Tab; page?: number } = {}) {
    const nextTab = next.tab ?? tab;
    const nextPage = next.page ?? page;

    startTransition(async () => {
      try {
        const data = await listManagedCourses({
          ...filters,
          page: nextPage,
          page_size: 12,
          is_published: nextTab === "all" ? undefined : nextTab === "published",
        });
        setResult(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load courses.");
      }
    });
  }

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    setPage(1);
    fetchWith({ tab: nextTab, page: 1 });
  }

  function handleFiltersChange(next: typeof filters) {
    setFilters(next);
    setPage(1);
    startTransition(async () => {
      try {
        const data = await listManagedCourses({
          ...next,
          page: 1,
          page_size: 12,
          is_published: tab === "all" ? undefined : tab === "published",
        });
        setResult(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load courses.");
      }
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" was deleted.`);
      setDeleteTarget(null);
      fetchWith();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete course.");
    } finally {
      setDeleting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All courses" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Course Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, build, and publish courses for the platform.
          </p>
        </div>
        <Link
          href="/dashboard/course-management/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 no-underline self-start"
        >
          <IconPlus />
          New Course
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
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

      <CourseFilters value={filters} onChange={handleFiltersChange} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={IconBookOpen}
          title="No courses found"
          description="Try adjusting your filters, or create a new course to get started."
        />
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${pending ? "opacity-60" : ""}`}>
          {result.items.map((course) => (
            <CourseCard key={course.id} course={course} onDelete={() => setDeleteTarget(course)} />
          ))}
        </div>
      )}

      {result.meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={!result.meta.has_previous || pending}
            onClick={() => {
              setPage(page - 1);
              fetchWith({ page: page - 1 });
            }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {result.meta.page} of {result.meta.total_pages}
          </span>
          <button
            type="button"
            disabled={!result.meta.has_next || pending}
            onClick={() => {
              setPage(page + 1);
              fetchWith({ page: page + 1 });
            }}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this course?"
        description={`"${deleteTarget?.title}" will be removed from listings. This can be reversed by an administrator on the backend if needed.`}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
