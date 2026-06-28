"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createItem } from "@/lib/api/courses-client";
import type { CourseItemType, CreateItemResult } from "@/lib/api/courses.types";
import { IconDocument, IconQuiz, IconSpinner, IconVideo } from "@/components/dashboard/icons";

const ITEM_TYPES: { value: CourseItemType; label: string; icon: React.ComponentType }[] = [
  { value: "VIDEO", label: "Video", icon: IconVideo },
  { value: "DOCUMENT", label: "Document", icon: IconDocument },
  { value: "QUIZ", label: "Quiz", icon: IconQuiz },
];

export function AddItemModal({
  open,
  courseId: _courseId,
  sectionId,
  nextOrderIndex,
  onClose,
  onCreated,
}: {
  open: boolean;
  courseId: string;
  sectionId: string;
  nextOrderIndex: number;
  onClose: () => void;
  onCreated: (result: CreateItemResult) => void;
}) {
  const [itemType, setItemType] = useState<CourseItemType>("VIDEO");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function reset() {
    setItemType("VIDEO");
    setTitle("");
    setFileName("");
    setIsPreview(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itemType === "DOCUMENT" && !fileName.trim()) {
      toast.error("A file name is required for document items.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createItem(_courseId, sectionId, {
        title,
        item_type: itemType,
        order_index: nextOrderIndex,
        is_preview: isPreview,
        file_name: itemType === "DOCUMENT" ? fileName.trim() : null,
      });
      onCreated(result);
      reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Add curriculum item</h2>

        <div className="grid grid-cols-3 gap-2">
          {ITEM_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setItemType(value)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                itemType === value
                  ? "border-[#2D6A4F] dark:border-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788]"
                  : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="item-title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            id="item-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={itemType === "VIDEO" ? "e.g. Welcome video" : itemType === "DOCUMENT" ? "e.g. Cheat sheet" : "e.g. Module 1 quiz"}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>

        {itemType === "DOCUMENT" && (
          <div>
            <label htmlFor="item-filename" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              File name
            </label>
            <input
              id="item-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              required
              placeholder="e.g. cheatsheet.pdf"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
            className="accent-[#2D6A4F]"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Allow non-enrolled users to preview this item
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting && <IconSpinner className="text-white/80" />}
            Add item
          </button>
        </div>
      </form>
    </div>
  );
}
