"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createAttachment, finalizeAttachmentDocument } from "@/lib/api/resources-client";
import type { CreateAttachmentResult, ResourceAttachmentType } from "@/lib/api/resources.types";
import {
  IconDocument,
  IconLink,
  IconSpinner,
  IconVideo,
  IconUpload,
  IconX,
} from "@/components/dashboard/icons";

const ATTACHMENT_TYPES: {
  value: ResourceAttachmentType;
  label: string;
  icon: React.ComponentType;
}[] = [
  { value: "VIDEO", label: "Video", icon: IconVideo },
  { value: "DOCUMENT", label: "Document", icon: IconDocument },
  { value: "LINKS", label: "Link", icon: IconLink },
];

export function AddAttachmentModal({
  open,
  resourceId,
  nextOrderIndex,
  onClose,
  onCreated,
}: {
  open: boolean;
  resourceId: string;
  nextOrderIndex: number;
  onClose: () => void;
  onCreated: (result: CreateAttachmentResult) => void;
}) {
  const [attachmentType, setAttachmentType] = useState<ResourceAttachmentType>("VIDEO");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setAttachmentType("VIDEO");
    setTitle("");
    setFile(null);
    setDownloadable(false);
    setLinkUrl("");
    setLinkLabel("");
    setLinkDescription("");
    setUploadProgress(null);
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileName = selectedFile.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    setTitle(lastDotIndex !== -1 ? fileName.slice(0, lastDotIndex) : fileName);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (attachmentType === "DOCUMENT" && !file) {
      toast.error("Please select a file for the document attachment.");
      return;
    }
    if (attachmentType === "LINKS" && !linkUrl.trim()) {
      toast.error("Please enter a URL for the link attachment.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Parameters<typeof createAttachment>[1] = {
        title,
        attachment_type: attachmentType,
        order_index: nextOrderIndex,
        file_name: attachmentType === "DOCUMENT" ? file!.name : null,
      };

      if (attachmentType === "DOCUMENT") {
        payload.downloadable = downloadable;
      } else if (attachmentType === "LINKS") {
        payload.url = linkUrl.trim();
        payload.label = linkLabel.trim() || null;
        payload.description = linkDescription.trim() || null;
      }

      const result = await createAttachment(resourceId, payload);

      if (attachmentType === "DOCUMENT" && result.document_upload && file) {
        setUploadProgress(0);
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", result.document_upload.upload_url);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress((event.loaded / event.total) * 100);
          }
        };
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              await finalizeAttachmentDocument(result.id, {
                mime_type: file.type,
                file_size_bytes: file.size,
              });
              if (result.document) {
                result.document.is_uploaded = true;
              }
              onCreated(result);
              reset();
              onClose();
            } catch (error) {
              toast.error(error instanceof ApiError ? error.message : "Failed to finalize upload.");
              setSubmitting(false);
              setUploadProgress(null);
            }
          } else {
            toast.error("File upload failed.");
            setSubmitting(false);
            setUploadProgress(null);
          }
        };
        xhr.onerror = () => {
          toast.error("File upload failed.");
          setSubmitting(false);
          setUploadProgress(null);
        };
        xhr.send(file);
      } else {
        onCreated(result);
        reset();
        onClose();
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add attachment.");
      setSubmitting(false);
    }
  }

  const isUploading = uploadProgress !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={() => !isUploading && onClose()}
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl flex flex-col gap-4"
      >
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Add attachment</h2>

        <fieldset disabled={isUploading}>
          <div className="grid grid-cols-3 gap-2">
            {ATTACHMENT_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAttachmentType(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  attachmentType === value
                    ? "border-[#2D6A4F] dark:border-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788]"
                    : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          <div className="my-4">
            <label htmlFor="attachment-title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              id="attachment-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                attachmentType === "VIDEO"
                  ? "e.g. Session recording"
                  : attachmentType === "DOCUMENT"
                    ? "e.g. Intake form (PDF)"
                    : "e.g. External reading"
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          {attachmentType === "DOCUMENT" && (
            <div className="space-y-3 mb-4">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <IconUpload />
                  Select Document
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0">
                    {file.name}
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Remove file"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={downloadable}
                  onChange={(e) => setDownloadable(e.target.checked)}
                  className="accent-[#2D6A4F]"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Allow viewers to download this document
                </span>
              </label>
            </div>
          )}

          {attachmentType === "LINKS" && (
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="attachment-link-url" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URL
                </label>
                <input
                  id="attachment-link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  required
                  placeholder="https://example.org/article"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                />
              </div>
              <div>
                <label htmlFor="attachment-link-label" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Display label (optional)
                </label>
                <input
                  id="attachment-link-label"
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="e.g. Trauma-Informed Practice: A Primer"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                />
              </div>
              <div>
                <label htmlFor="attachment-link-description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="attachment-link-description"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={2}
                  placeholder="A short blurb about this resource."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                />
              </div>
            </div>
          )}
        </fieldset>

        {isUploading && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-center text-gray-700 dark:text-gray-300">
              Uploading: {Math.round(uploadProgress)}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-[#2D6A4F] h-2.5 rounded-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

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
            {submitting && !isUploading && <IconSpinner className="text-white/80" />}
            {isUploading ? "Uploading..." : "Add attachment"}
          </button>
        </div>
      </form>
    </div>
  );
}
