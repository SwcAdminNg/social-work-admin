"use client";

import { useState } from "react";
import type { ManagedCourseListParams } from "@/lib/api/courses.types";
import { IconSearch } from "@/components/dashboard/icons";
import { CATEGORY_OPTIONS, LEVEL_OPTIONS } from "./constants";
import { CustomDropdown } from "@/components/generic/ui/CustomDropdown";

type FilterValue = Pick<ManagedCourseListParams, "search" | "category" | "level" | "is_free" | "instructor_name">;

const categoryOptions = [{ value: "all", label: "All Categories" }, ...CATEGORY_OPTIONS];
const levelOptions = [{ value: "all", label: "All Levels" }, ...LEVEL_OPTIONS];
const priceOptions = [
    { value: "all", label: "Free & Paid" },
    { value: "true", label: "Free only" },
    { value: "false", label: "Paid only" },
];

export function CourseFilters({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}) {
  const [search, setSearch] = useState(value.search ?? "");
  const [instructorName, setInstructorName] = useState(value.instructor_name ?? "");

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
          autoComplete="off"

          placeholder="Search courses by title…"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </form>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ ...value, instructor_name: instructorName || undefined });
        }}
        className="relative flex-1"
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch />
        </span>
        <input
          type="text"
          value={instructorName}
          onChange={(e) => setInstructorName(e.target.value)}
          placeholder="Filter by instructor…"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </form>

      <div className="w-full sm:w-auto">
        <CustomDropdown
            options={categoryOptions}
            value={value.category ?? "all"}
            onChange={(val) => onChange({ ...value, category: val === "all" ? undefined : (val as FilterValue["category"]) })}
            ariaLabel="Filter by category"
        />
      </div>

      <div className="w-full sm:w-auto">
        <CustomDropdown
            options={levelOptions}
            value={value.level ?? "all"}
            onChange={(val) => onChange({ ...value, level: val === "all" ? undefined : (val as FilterValue["level"]) })}
            ariaLabel="Filter by level"
        />
      </div>

      <div className="w-full sm:w-auto">
        <CustomDropdown
            options={priceOptions}
            value={value.is_free === undefined ? "all" : String(value.is_free)}
            onChange={(val) => onChange({ ...value, is_free: val === "all" ? undefined : val === "true" })}
            ariaLabel="Filter by price"
        />
      </div>
    </div>
  );
}

