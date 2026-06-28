"use client";

import { useState } from "react";
import type { ManagedCourseListParams } from "@/lib/api/courses.types";
import { IconSearch } from "@/components/dashboard/icons";
import { CATEGORY_OPTIONS, LEVEL_OPTIONS } from "./constants";

type FilterValue = Pick<ManagedCourseListParams, "search" | "category" | "level" | "is_free">;

export function CourseFilters({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}) {
  const [search, setSearch] = useState(value.search ?? "");

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ ...value, search: search || undefined });
        }}
        className="relative flex-1"
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses by title…"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </form>

      <select
        value={value.category ?? ""}
        onChange={(e) =>
          onChange({ ...value, category: (e.target.value || undefined) as FilterValue["category"] })
        }
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
      >
        <option value="">All categories</option>
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={value.level ?? ""}
        onChange={(e) =>
          onChange({ ...value, level: (e.target.value || undefined) as FilterValue["level"] })
        }
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
      >
        <option value="">All levels</option>
        {LEVEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={value.is_free === undefined ? "" : String(value.is_free)}
        onChange={(e) =>
          onChange({
            ...value,
            is_free: e.target.value === "" ? undefined : e.target.value === "true",
          })
        }
        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
      >
        <option value="">Free &amp; paid</option>
        <option value="true">Free only</option>
        <option value="false">Paid only</option>
      </select>
    </div>
  );
}
