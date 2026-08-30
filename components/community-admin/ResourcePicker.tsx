"use client";

import { useEffect, useRef, useState } from "react";
import { listManagedResources } from "@/lib/api/resources-client";
import type { Resource } from "@/lib/api/resources.types";
import { IconLibrary, IconSpinner } from "@/components/dashboard/icons";

const SEARCH_DEBOUNCE_MS = 300;

/** Popover for picking a published Resource to share in a message (resource_reference_id). */
export function ResourcePicker({
  courseId,
  onPick,
  onClose,
}: {
  courseId?: string | null;
  onPick: (resource: Resource) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      listManagedResources({
        search: query.trim() || undefined,
        course_id: courseId ?? undefined,
        page: 1,
        page_size: 8,
      })
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
  }, [query, courseId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full mb-2 left-0 w-80 max-h-72 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20"
    >
      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources to share…"
          className="w-full px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-6">
          <IconSpinner className="w-4 h-4 text-gray-400" />
        </div>
      ) : results.length === 0 ? (
        <p className="px-3 py-4 text-sm text-gray-400 text-center">No resources found.</p>
      ) : (
        results.map((resource) => (
          <button
            key={resource.id}
            type="button"
            onClick={() => onPick(resource)}
            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 cursor-pointer"
          >
            <IconLibrary />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{resource.name}</span>
          </button>
        ))
      )}
    </div>
  );
}
