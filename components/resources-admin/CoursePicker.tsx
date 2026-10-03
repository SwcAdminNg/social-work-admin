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
        className="flex items-center justify-between cursor-pointer w-full rounded-xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
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
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
              aria-label="Clear selected course"
            >
              <IconX size={16} />
            </button>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-600">Select a course…</span>
        )}
        <IconChevronDown className="flex-shrink-0 text-slate-400" />
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-xl shadow-lg max-h-72 flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-ink-line">
            <input
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="Search your courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto p-1 flex-1">
            {loading ? (
              <div className="p-3 text-sm text-slate-500 text-center">Loading…</div>
            ) : courses.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">No courses found</div>
            ) : (
              courses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onChange(c.id, c.title);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded-lg truncate"
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
