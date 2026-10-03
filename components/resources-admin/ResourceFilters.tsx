"use client";

import { useState } from "react";
import type { ManagedResourceListParams } from "@/lib/api/resources.types";
import { IconSearch } from "@/components/dashboard/icons";
import { CATEGORY_OPTIONS } from "./constants";
import { CustomDropdown } from "@/components/generic/ui/CustomDropdown";

type FilterValue = Pick<ManagedResourceListParams, "search" | "category">;

const categoryOptions = [{ value: "all", label: "All Categories" }, ...CATEGORY_OPTIONS];

export function ResourceFilters({
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
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <IconSearch />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          placeholder="Search resources by name…"
          className="w-full rounded-xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
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
    </div>
  );
}
