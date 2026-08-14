"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createItem, finalizeDocument } from "@/lib/api/courses-client";
import type { CourseItemType, CreateItemResult } from "@/lib/api/courses.types";
import {
  IconDocument,
  IconDocumentText,
  IconQuiz,
  IconSpinner,
  IconVideo,
  IconUpload,
  IconX,
} from "@/components/dashboard/icons";

type UIItemType = "VIDEO" | "DOCUMENT" | "QUIZ" | "ESSAY";

const ITEM_TYPES: {
  value: UIItemType;
  label: string;
  icon: React.ComponentType;
}[] = [
  { value: "VIDEO", label: "Video", icon: IconVideo },
  { value: "DOCUMENT", label: "Document", icon: IconDocument },
  { value: "QUIZ", label: "Quiz", icon: IconQuiz },
  { value: "ESSAY", label: "Essay", icon: IconDocumentText },
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
  const [itemType, setItemType] = useState<UIItemType>("VIDEO");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setItemType("VIDEO");
    setTitle("");
    setFile(null);
    setIsPreview(false);
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

    if (lastDotIndex !== -1) {
      const name = fileName.slice(0, lastDotIndex);
      setTitle(name);
    } else {
      setTitle(fileName);
    }
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itemType === "DOCUMENT" && !file) {
      toast.error("Please select a file for the document item.");
      return;
    }

    setSubmitting(true);
    try {
      let actualItemType: CourseItemType = "VIDEO";
      if (itemType === "DOCUMENT") actualItemType = "DOCUMENT";
      else if (itemType === "QUIZ" || itemType === "ESSAY") actualItemType = "ASSESSMENT";

      const payload: Parameters<typeof createItem>[2] = {
        title,
        item_type: actualItemType,
        order_index: nextOrderIndex,
        is_preview: isPreview,
        file_name: itemType === "DOCUMENT" ? file!.name : null,
      };

      if (itemType === "QUIZ") {
        payload.assessment_type = "QUIZ";
        payload.quiz_settings = { max_attempts: null, pass_mark_percentage: 70, show_result_to_student: true };
      } else if (itemType === "ESSAY") {
        payload.assessment_type = "ESSAY";
        payload.essay_settings = { question: title, description: "Write your answer here.", submission_mode: "TEXT" };
      }

      const result = await createItem(_courseId, sectionId, payload);

      // Backend may not echo the full assessment payload on creation,
      // inject default state so the UI builder can immediately render.
      if (itemType === "QUIZ" || itemType === "ESSAY") {
        if (!result.assessment) {
          result.assessment = {
            id: result.id,
            assessment_type: itemType,
            due_date: null,
          };
          if (itemType === "QUIZ") {
            result.assessment.quiz = {
              max_attempts: null,
              pass_mark_percentage: 70,
              show_result_to_student: true,
              questions: [],
            };
          } else if (itemType === "ESSAY") {
            result.assessment.essay = {
              question: title,
              description: "Write your answer here.",
              submission_mode: "TEXT",
            };
          }
        }
      }

      if (itemType === "DOCUMENT" && result.document_upload && file) {
        setUploadProgress(0);
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", result.document_upload.upload_url);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(percentComplete);
          }
        };
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              await finalizeDocument(result.id, {
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
              toast.error(
                error instanceof ApiError
                  ? error.message
                  : "Failed to finalize upload.",
              );
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
      toast.error(
        error instanceof ApiError ? error.message : "Failed to add item.",
      );
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
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Add curriculum item
        </h2>

        <fieldset disabled={isUploading}>
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

          <div className="my-4">
            <label
              htmlFor="item-title"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Title
            </label>
            <input
              id="item-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                itemType === "VIDEO"
                  ? "e.g. Welcome video"
                  : itemType === "DOCUMENT"
                    ? "e.g. Cheat sheet"
                    : itemType === "QUIZ"
                      ? "e.g. Module 1 quiz"
                      : "e.g. Midterm essay"
              }
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          {itemType === "DOCUMENT" && (
            <div className="space-y-3 mb-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
              />
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
            {submitting && !isUploading && (
              <IconSpinner className="text-white/80" />
            )}
            {isUploading ? "Uploading..." : "Add item"}
          </button>
        </div>
      </form>
    </div>
  );
}
