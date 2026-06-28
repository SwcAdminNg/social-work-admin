"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteSection, updateSection } from "@/lib/api/courses-client";
import type { CourseDetail, CourseSection, CreateItemResult } from "@/lib/api/courses.types";
import { IconChevronDown, IconDragHandle, IconPlus, IconTrash } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { ConfirmDialog } from "./ConfirmDialog";
import { ItemList } from "./ItemList";
import { AddItemModal } from "./AddItemModal";

export function SectionCard({
  course,
  section,
  dispatch,
  onRefresh,
  onItemCreated,
  documentUploadCredentials,
}: {
  course: CourseDetail;
  section: CourseSection;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRefresh: () => void;
  onItemCreated: (sectionId: string, result: CreateItemResult) => void;
  documentUploadCredentials: Record<string, { upload_url: string; storage_key: string }>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const [expanded, setExpanded] = useState(true);
  const [title, setTitle] = useState(section.title);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === section.title) {
      setTitle(section.title);
      return;
    }
    try {
      await updateSection(course.id, section.id, { title: trimmed });
      dispatch({ type: "UPDATE_SECTION", sectionId: section.id, fields: { title: trimmed } });
    } catch (error) {
      setTitle(section.title);
      toast.error(error instanceof ApiError ? error.message : "Failed to rename section.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteSection(course.id, section.id);
      dispatch({ type: "REMOVE_SECTION", sectionId: section.id });
      toast.success("Section deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete section.");
      setDeleting(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder section"
        >
          <IconDragHandle />
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="flex-1 min-w-0 bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1.5 py-0.5"
        />

        <span className="text-xs font-medium text-gray-400 dark:text-gray-600 flex-shrink-0">
          {section.items.length} item{section.items.length === 1 ? "" : "s"}
        </span>

        <button
          type="button"
          onClick={() => setAddItemOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 cursor-pointer flex-shrink-0"
        >
          <IconPlus />
          Add item
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
          aria-label="Delete section"
        >
          <IconTrash />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-transform duration-150 cursor-pointer"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <IconChevronDown />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          <ItemList
            courseId={course.id}
            section={section}
            dispatch={dispatch}
            onRefresh={onRefresh}
            documentUploadCredentials={documentUploadCredentials}
          />
        </div>
      )}

      <AddItemModal
        open={addItemOpen}
        courseId={course.id}
        sectionId={section.id}
        nextOrderIndex={section.items.length}
        onClose={() => setAddItemOpen(false)}
        onCreated={(result) => {
          onItemCreated(section.id, result);
          setAddItemOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this section?"
        description={`"${section.title}" and all its items will be removed.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
