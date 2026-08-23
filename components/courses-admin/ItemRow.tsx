"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteItem, updateItem } from "@/lib/api/courses-client";
import type { CourseItem } from "@/lib/api/courses.types";
import {
  IconChevronDown,
  IconClock,
  IconDocument,
  IconDocumentText,
  IconDragHandle,
  IconQuiz,
  IconTrash,
  IconVideo,
} from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { ConfirmDialog } from "./ConfirmDialog";
import { VideoStatusBadge } from "./StatusBadge";
import { VideoUploader } from "./VideoUploader";
import { DocumentUploader } from "./DocumentUploader";
import { QuizBuilder } from "./QuizBuilder";
import { EssayBuilder } from "./EssayBuilder";
import { QuizGroupBuilder } from "./QuizGroupBuilder";
import { FinalAssessmentBadge } from "./FinalAssessmentControls";

const TYPE_SWATCH_STYLES: Record<string, string> = {
  VIDEO: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  DOCUMENT: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  QUIZ: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  ESSAY: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
  QUIZ_GROUP: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
};

function assessmentSummary(item: CourseItem): string | null {
  const assessment = item.assessment;
  if (!assessment) return null;
  const due = assessment.due_date ? `Due ${new Date(assessment.due_date).toLocaleDateString()}` : null;

  if (assessment.assessment_type === "ESSAY" && assessment.essay) {
    const parts = [assessment.essay.submission_mode === "TEXT" ? "Text submission" : "File upload"];
    if (assessment.is_final_assessment) {
      const attempts = assessment.essay.max_attempts
        ? `${assessment.essay.max_attempts} attempt${assessment.essay.max_attempts === 1 ? "" : "s"}`
        : "Unlimited attempts";
      parts.push(`${assessment.essay.pass_mark_percentage}% pass`, attempts);
    }
    parts.push(due ?? "");
    return parts.filter(Boolean).join(" · ");
  }

  const settings = assessment.assessment_type === "QUIZ" ? assessment.quiz : assessment.quiz_group;
  if (!settings) return null;
  const attempts = settings.max_attempts
    ? `${settings.max_attempts} attempt${settings.max_attempts === 1 ? "" : "s"}`
    : "Unlimited attempts";
  return [`${settings.pass_mark_percentage}% pass`, attempts, due].filter(Boolean).join(" · ");
}

export function ItemRow({
  item,
  dispatch,
  onRequestRefresh,
  documentUploadCredentials,
  defaultExpanded = false,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRequestRefresh?: () => void;
  documentUploadCredentials?: { upload_url: string; storage_key: string };
  defaultExpanded?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [title, setTitle] = useState(item.title);
  const [estimatedMinutes, setEstimatedMinutes] = useState(item.estimated_minutes ? String(item.estimated_minutes) : "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  let TypeIcon = IconVideo;
  let typeKey = "VIDEO";
  if (item.item_type === "DOCUMENT") {
    TypeIcon = IconDocument;
    typeKey = "DOCUMENT";
  } else if (item.item_type === "ASSESSMENT") {
    typeKey = item.assessment?.assessment_type ?? "QUIZ";
    TypeIcon = typeKey === "ESSAY" ? IconDocumentText : IconQuiz;
  }
  const summary = !expanded ? assessmentSummary(item) : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === item.title) {
      setTitle(item.title);
      return;
    }
    try {
      await updateItem(item.id, { title: trimmed });
      dispatch({ type: "UPDATE_ITEM", itemId: item.id, fields: { title: trimmed } });
    } catch (error) {
      setTitle(item.title);
      toast.error(error instanceof ApiError ? error.message : "Failed to rename item.");
    }
  }

  async function saveEstimatedMinutes() {
    const trimmed = estimatedMinutes.trim();
    const parsed = parseInt(trimmed, 10);
    const newVal = !isNaN(parsed) && parsed >= 0 ? parsed : null;

    if (newVal === item.estimated_minutes) {
      setEstimatedMinutes(item.estimated_minutes ? String(item.estimated_minutes) : "");
      return;
    }
    
    try {
      await updateItem(item.id, { estimated_minutes: newVal });
      dispatch({ type: "UPDATE_ITEM", itemId: item.id, fields: { estimated_minutes: newVal } });
      setEstimatedMinutes(newVal ? String(newVal) : "");
    } catch (error) {
      setEstimatedMinutes(item.estimated_minutes ? String(item.estimated_minutes) : "");
      toast.error(error instanceof ApiError ? error.message : "Failed to update estimated time.");
    }
  }

  async function togglePreview() {
    const next = !item.is_preview;
    try {
      await updateItem(item.id, { is_preview: next });
      dispatch({ type: "UPDATE_ITEM", itemId: item.id, fields: { is_preview: next } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update preview setting.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteItem(item.id);
      dispatch({ type: "REMOVE_ITEM", itemId: item.id });
      toast.success("Item deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete item.");
      setDeleting(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40"
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <IconDragHandle />
        </button>

        <span
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 ${TYPE_SWATCH_STYLES[typeKey]}`}
        >
          <TypeIcon />
        </span>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-0.5"
        />

        {summary && (
          <span className="hidden md:inline text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 truncate max-w-[220px]">
            {summary}
          </span>
        )}

        {item.assessment?.is_final_assessment && <FinalAssessmentBadge />}

        {item.video && <VideoStatusBadge status={item.video.status} />}
        {item.document && (
          <span
            className={`text-[0.7rem] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
              item.document.is_uploaded
                ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {item.document.is_uploaded ? "Uploaded" : "Pending upload"}
          </span>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 ml-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
          <IconClock className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="number"
            min="0"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            onBlur={saveEstimatedMinutes}
            placeholder="Time"
            className="w-16 bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none placeholder-gray-400"
            title="Estimated minutes"
          />
          <span className="text-[0.65rem] uppercase font-bold text-gray-400 tracking-wider select-none">min</span>
        </div>

        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none flex-shrink-0 ml-2">
          <input type="checkbox" checked={item.is_preview} onChange={togglePreview} className="accent-[#2D6A4F]" />
          Preview
        </label>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
          aria-label="Delete item"
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
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {item.item_type === "VIDEO" && (
            <VideoUploader
              item={item}
              onVideoUpdate={(video) => dispatch({ type: "UPDATE_ITEM", itemId: item.id, fields: { video } })}
              onRequestRefresh={onRequestRefresh}
            />
          )}
          {item.item_type === "DOCUMENT" && (
            <DocumentUploader
              item={item}
              credentials={documentUploadCredentials}
              onDocumentUpdate={(document) =>
                dispatch({ type: "UPDATE_ITEM", itemId: item.id, fields: { document } })
              }
            />
          )}
          {item.item_type === "ASSESSMENT" && item.assessment?.assessment_type === "QUIZ" && (
            <QuizBuilder item={item} dispatch={dispatch} />
          )}
          {item.item_type === "ASSESSMENT" && item.assessment?.assessment_type === "ESSAY" && (
            <EssayBuilder item={item} dispatch={dispatch} />
          )}
          {item.item_type === "ASSESSMENT" && item.assessment?.assessment_type === "QUIZ_GROUP" && (
            <QuizGroupBuilder item={item} dispatch={dispatch} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this item?"
        description={`"${item.title}" will be removed from this section.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
