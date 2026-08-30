"use client";

import { useEffect, useRef, useState } from "react";
import { listManagedCourses } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { IconSearch, IconSpinner, IconX } from "@/components/dashboard/icons";

export interface PickedCourse {
  id: string;
  title: string;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Searches courses to snapshot into a custom community. `multiple` controls whether more than
 * one course can be picked (creation allows several `course_snapshot_ids`; adding members to an
 * existing community only takes one `course_snapshot_id` at a time).
 */
export function CoursePicker({
  value,
  onChange,
  multiple = true,
  placeholder = "Search courses to snapshot enrollees from…",
}: {
  value: PickedCourse[];
  onChange: (courses: PickedCourse[]) => void;
  multiple?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      listManagedCourses({ search: query.trim(), page: 1, page_size: 10 })
        .then((res) => {
          if (!cancelled) setResults(res.items ?? []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = new Set(value.map((c) => c.id));
  const filteredResults = results.filter((c) => !selectedIds.has(c.id));

  function addCourse(course: Course) {
    onChange(multiple ? [...value, { id: course.id, title: course.title }] : [{ id: course.id, title: course.title }]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeCourse(id: string) {
    onChange(value.filter((c) => c.id !== id));
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((course) => (
            <span
              key={course.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold"
            >
              {course.title}
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                className="text-current opacity-70 hover:opacity-100 cursor-pointer"
                aria-label={`Remove ${course.title}`}
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {(multiple || value.length === 0) && (
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
          {loading && <IconSpinner className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        </div>
      )}

      {open && query.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 z-10 max-h-56 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          {!loading && filteredResults.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">No matching courses.</p>
          ) : (
            filteredResults.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => addCourse(course)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
