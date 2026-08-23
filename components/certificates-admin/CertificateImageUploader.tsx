"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getLogoUploadUrl, getSignatureUploadUrl } from "@/lib/api/certificates-client";
import { IconUpload } from "@/components/dashboard/icons";

export function CertificateImageUploader({
  templateId,
  kind,
  label,
  hint,
  currentImageUrl,
  onImageUploaded,
}: {
  templateId: string;
  kind: "logo" | "signature";
  label: string;
  hint: string;
  currentImageUrl: string | null;
  onImageUploaded: (imageUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const getUploadUrl = kind === "logo" ? getLogoUploadUrl : getSignatureUploadUrl;
      const { upload_url, image_url } = await getUploadUrl(templateId, {
        file_name: file.name,
        content_type: file.type,
      });

      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) {
        throw new Error("File upload to storage failed. Please try again.");
      }

      onImageUploaded(image_url);
      toast.success(`${label} uploaded successfully.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `Failed to upload ${label.toLowerCase()}.`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {currentImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentImageUrl} alt={label} className="object-contain w-full h-full" />
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <IconUpload />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{hint}</p>
    </div>
  );
}
