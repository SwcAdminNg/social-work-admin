"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, requestProfilePictureUpload } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function ProfilePictureCard() {
  const { update } = useSession();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Shown instantly while the upload runs, so the change feels immediate.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
  });
  const user = data?.data;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Admin";
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  const savedUrl =
    user?.profile_picture_url && user.profile_picture_url !== failedUrl ? user.profile_picture_url : null;
  const imageUrl = previewUrl ?? savedUrl;

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is larger than 5 MB. Choose a smaller one.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const prepared = await requestProfilePictureUpload({
        file_name: file.name,
        content_type: file.type,
      });
      const { upload_url, profile_picture_url } = prepared.data;

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("The upload didn't finish. Please try again.");
      }

      // Keep the header avatar, this card and the form in sync without a reload.
      queryClient.setQueryData(["currentUser"], (current: typeof data) =>
        current ? { ...current, data: { ...current.data, profile_picture_url } } : current,
      );
      await update({ profile_picture_url });
      setFailedUrl(null);
      toast.success("Profile photo updated.");
    } catch (error) {
      setPreviewUrl(null);
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Couldn't update your profile photo.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-start gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:p-8">
      <div className="relative flex-shrink-0">
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-3xl font-bold text-white shadow-md ring-4 ring-white dark:bg-brand-400 dark:text-[#06130d] dark:ring-slate-800">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${name}'s profile photo`}
              className="h-full w-full object-cover"
              onError={() => setFailedUrl(imageUrl)}
            />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
        </span>
        {uploading && (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white"
            role="status"
          >
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Uploading" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Profile photo</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Shown in the header, in community chat and on approvals you review. JPG, PNG or WebP, up to 5 MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-label="Choose a profile photo"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 dark:hover:bg-brand-500"
        >
          <Camera className="h-4 w-4" aria-hidden />
          {imageUrl ? "Change photo" : "Upload photo"}
        </button>
      </div>
    </div>
  );
}
