"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { finalizeAttachmentDocument } from "@/lib/api/resources-client";
import type {
  ResourceAttachment,
  ResourceDocument,
  ResourceDocumentUploadCredentials,
} from "@/lib/api/resources.types";
import { IconSpinner, IconUpload } from "@/components/dashboard/icons";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({
  attachment,
  credentials,
  onDocumentUpdate,
}: {
  attachment: ResourceAttachment;
  credentials?: ResourceDocumentUploadCredentials;
  onDocumentUpdate: (document: ResourceDocument) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const doc = attachment.document;

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !credentials) return;

    setUploading(true);
    try {
      const putRes = await fetch(credentials.upload_url, { method: "PUT", body: file });
      if (!putRes.ok) throw new Error("File upload to storage failed.");

      await finalizeAttachmentDocument(attachment.id, { mime_type: file.type, file_size_bytes: file.size });
      onDocumentUpdate({
        file_name: doc?.file_name ?? file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        is_uploaded: true,
        downloadable: doc?.downloadable,
      });
      toast.success("Document uploaded.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  if (doc?.is_uploaded) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-gray-200">{doc.file_name}</span>
        {doc.file_size_bytes != null && <span>{formatBytes(doc.file_size_bytes)}</span>}
        <span className="text-[#2D6A4F] dark:text-[#52b788] font-semibold">Uploaded</span>
      </div>
    );
  }

  if (!credentials) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3.5 py-2.5">
        The upload link for this document has expired (10 minute window). Delete this attachment and add it
        again to get a fresh upload link.
      </p>
    );
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {uploading ? <IconSpinner /> : <IconUpload />}
        {uploading ? "Uploading…" : `Upload ${doc?.file_name ?? "file"}`}
      </button>
    </div>
  );
}
