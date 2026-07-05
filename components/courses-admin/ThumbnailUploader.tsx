"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getThumbnailUploadUrl } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { IconUpload } from "@/components/dashboard/icons";

export function ThumbnailUploader({
  courseId,
  currentThumbnail,
  onThumbnailUploaded,
}: {
  courseId: string;
  currentThumbnail: string | null;
  onThumbnailUploaded: (thumbnailUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      // 1. Get pre-signed URL from backend
      const { upload_url, thumbnail_url } = await getThumbnailUploadUrl(courseId, {
        file_name: file.name,
        content_type: file.type,
      });

      // 2. Upload file to R2
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) {
        throw new Error("File upload to storage failed. Please try again.");
      }

      // 3. Notify parent component of new thumbnail URL
      onThumbnailUploaded(thumbnail_url);
      toast.success("Thumbnail uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to upload thumbnail.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label htmlFor="thumbnail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Thumbnail
      </label>
      <div className="flex items-center gap-4">
        <div className="w-32 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
          {currentThumbnail && (
            <Image
              src={currentThumbnail}
              alt="Course thumbnail"
              width={128}
              height={80}
              className="object-cover w-full h-full"
            />
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
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Recommended size: 1280x720 pixels.
      </p>
    </div>
  );
}
