"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getCatalogs, createCatalog } from "@/lib/api/courses-client";
import type { CourseCatalog, CreateCatalogPayload, CourseCategory } from "@/lib/api/courses.types";
import {
  IconFolder,
  IconPlus,
  IconSpinner,
  IconX,
} from "@/components/dashboard/icons";
import { CATEGORY_OPTIONS, categoryLabel } from "./constants";

interface CourseCatalogsManagerProps {
  initialData: CourseCatalog[];
}

export function CourseCatalogsManager({ initialData }: CourseCatalogsManagerProps) {
  const [catalogs, setCatalogs] = useState<CourseCatalog[]>(initialData);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [iconName, setIconName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<CourseCategory>>(new Set());

  const [saving, startSave] = useTransition();

  const refetchCatalogs = useCallback(async () => {
    try {
      const fresh = await getCatalogs();
      setCatalogs(fresh);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    refetchCatalogs();
  }, [refetchCatalogs]);

  function handleCategoryToggle(cat: CourseCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (selectedCategories.size === 0) {
      toast.error("Please select at least one category.");
      return;
    }

    startSave(async () => {
      try {
        const payload: CreateCatalogPayload = {
          name: name.trim(),
          categories: Array.from(selectedCategories),
          icon_name: iconName.trim() || undefined,
          description: description.trim() || undefined,
        };
        await createCatalog(payload);
        toast.success("Catalog created successfully.");
        
        // Reset form
        setName("");
        setIconName("");
        setDescription("");
        setSelectedCategories(new Set());
        setIsCreateOpen(false);

        // Refetch
        await refetchCatalogs();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to create catalog.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Course Catalogs
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Group multiple categories into user-friendly collections for the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 cursor-pointer self-start"
          >
            <IconPlus />
            Create Catalog
          </button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600">
                <IconFolder />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  No catalogs created
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Click "Create Catalog" to group your courses.
                </p>
              </div>
            </div>
          ) : (
            catalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center flex-shrink-0">
                      <IconFolder />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
                        {catalog.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {catalog.icon_name || "No icon"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {catalog.total_courses ?? 0} course{(catalog.total_courses ?? 0) !== 1 && "s"}
                  </span>
                </div>

                {catalog.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {catalog.description}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-[0.7rem] font-medium rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {categoryLabel(cat)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <form onSubmit={handleCreate} className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Create Course Catalog
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex flex-col gap-4">
                <div>
                  <label htmlFor="catalog-name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="catalog-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. IT & Information Management"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/40 transition"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-icon" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Icon Name
                  </label>
                  <input
                    id="catalog-icon"
                    type="text"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    placeholder="e.g. computer-desktop"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/40 transition"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-desc" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="catalog-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this catalog..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/40 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Mapped Categories <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(opt.value)}
                          onChange={() => handleCategoryToggle(opt.value)}
                          className="w-4 h-4 text-[#2D6A4F] border-gray-300 rounded focus:ring-[#2D6A4F]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/30 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
                >
                  {saving && <IconSpinner className="w-4 h-4" />}
                  {saving ? "Creating..." : "Create Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
