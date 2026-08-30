"use client";

import { useEffect, useRef, useState } from "react";
import { listManagedCourses } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { IconChevronDown, IconX } from "@/components/dashboard/icons";

export function CoursePicker({
  value,
  valueLabel,
  onChange,
}: {
  value: string | null;
  /** Best-effort title for the currently selected course, shown before search results load. */
  valueLabel?: string | null;
  onChange: (courseId: string | null, courseTitle: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listManagedCourses({ search: search || undefined, page: 1, page_size: 20 });
        if (active) setCourses(res.items);
      } catch {
        // ignore — picker just shows no results
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [open, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedTitle = valueLabel ?? courses.find((c) => c.id === value)?.title ?? null;

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center justify-between cursor-pointer w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        onClick={() => setOpen((v) => !v)}
      >
        {value ? (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="truncate">{selectedTitle ?? "Selected course"}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              aria-label="Clear selected course"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-600">Select a course…</span>
        )}
        <IconChevronDown className="flex-shrink-0 text-gray-400" />
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="Search your courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto p-1 flex-1">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">Loading…</div>
            ) : courses.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">No courses found</div>
            ) : (
              courses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onChange(c.id, c.title);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded-lg truncate"
                >
                  {c.title}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
