"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteAttachment, updateAttachment } from "@/lib/api/resources-client";
import type { ResourceAttachment, ResourceDocumentUploadCredentials } from "@/lib/api/resources.types";
import {
  IconChevronDown,
  IconDocument,
  IconDragHandle,
  IconLink,
  IconTrash,
  IconVideo,
} from "@/components/dashboard/icons";
import type { ResourceEditorAction } from "./resourceEditorReducer";
import { ConfirmDialog } from "@/components/courses-admin/ConfirmDialog";
import { VideoStatusBadge } from "./StatusBadge";
import { VideoUploader } from "./VideoUploader";
import { DocumentUploader } from "./DocumentUploader";
import { LinkEditor } from "./LinkEditor";

const TYPE_SWATCH_STYLES: Record<string, string> = {
  VIDEO: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  DOCUMENT: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  LINKS: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
};

export function AttachmentRow({
  attachment,
  dispatch,
  onRequestRefresh,
  documentUploadCredentials,
  defaultExpanded = false,
}: {
  attachment: ResourceAttachment;
  dispatch: React.Dispatch<ResourceEditorAction>;
  onRequestRefresh?: () => void;
  documentUploadCredentials?: ResourceDocumentUploadCredentials;
  defaultExpanded?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: attachment.id,
  });
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [title, setTitle] = useState(attachment.title);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  let TypeIcon = IconVideo;
  if (attachment.attachment_type === "DOCUMENT") TypeIcon = IconDocument;
  else if (attachment.attachment_type === "LINKS") TypeIcon = IconLink;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === attachment.title) {
      setTitle(attachment.title);
      return;
    }
    try {
      await updateAttachment(attachment.id, { title: trimmed });
      dispatch({ type: "UPDATE_ATTACHMENT", attachmentId: attachment.id, fields: { title: trimmed } });
    } catch (error) {
      setTitle(attachment.title);
      toast.error(error instanceof ApiError ? error.message : "Failed to rename attachment.");
    }
  }

  async function toggleDownloadable() {
    if (!attachment.document) return;
    const next = !attachment.document.downloadable;
    try {
      await updateAttachment(attachment.id, { downloadable: next });
      dispatch({
        type: "UPDATE_ATTACHMENT",
        attachmentId: attachment.id,
        fields: { document: { ...attachment.document, downloadable: next } },
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update downloadable setting.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAttachment(attachment.id);
      dispatch({ type: "REMOVE_ATTACHMENT", attachmentId: attachment.id });
      toast.success("Attachment deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete attachment.");
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
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center [&_svg]:w-3.5 [&_svg]:h-3.5 ${TYPE_SWATCH_STYLES[attachment.attachment_type]}`}
        >
          <TypeIcon />
        </span>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-0.5"
        />

        {attachment.video && <VideoStatusBadge status={attachment.video.status} />}
        {attachment.document && (
          <span
            className={`text-[0.7rem] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
              attachment.document.is_uploaded
                ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {attachment.document.is_uploaded ? "Uploaded" : "Pending upload"}
          </span>
        )}

        {attachment.document && (
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none flex-shrink-0 ml-2">
            <input
              type="checkbox"
              checked={!!attachment.document.downloadable}
              onChange={toggleDownloadable}
              className="accent-[#2D6A4F]"
            />
            Downloadable
          </label>
        )}

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
          aria-label="Delete attachment"
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
          {attachment.attachment_type === "VIDEO" && (
            <VideoUploader
              attachment={attachment}
              onVideoUpdate={(video) =>
                dispatch({ type: "UPDATE_ATTACHMENT", attachmentId: attachment.id, fields: { video } })
              }
              onRequestRefresh={onRequestRefresh}
            />
          )}
          {attachment.attachment_type === "DOCUMENT" && (
            <DocumentUploader
              attachment={attachment}
              credentials={documentUploadCredentials}
              onDocumentUpdate={(document) =>
                dispatch({ type: "UPDATE_ATTACHMENT", attachmentId: attachment.id, fields: { document } })
              }
            />
          )}
          {attachment.attachment_type === "LINKS" && (
            <LinkEditor
              attachment={attachment}
              onLinkUpdate={(link) =>
                dispatch({ type: "UPDATE_ATTACHMENT", attachmentId: attachment.id, fields: { link } })
              }
            />
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this attachment?"
        description={`"${attachment.title}" will be removed from this resource.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
