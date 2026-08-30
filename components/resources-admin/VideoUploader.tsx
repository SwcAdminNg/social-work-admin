"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { refreshAttachmentVideoUpload } from "@/lib/api/resources-client";
import type { ResourceAttachment, ResourceVideo } from "@/lib/api/resources.types";
import { IconRefresh, IconSpinner, IconUpload } from "@/components/dashboard/icons";
import { VideoStatusBadge } from "./StatusBadge";

export function VideoUploader({
  attachment,
  onVideoUpdate,
  onRequestRefresh,
}: {
  attachment: ResourceAttachment;
  onVideoUpdate: (video: ResourceVideo) => void;
  onRequestRefresh?: () => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = attachment.video?.status ?? "PENDING";

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPreparing(true);
    try {
      const credentials = await refreshAttachmentVideoUpload(attachment.id);
      setPreparing(false);
      setProgress(0);

      const upload = new tus.Upload(file, {
        endpoint: credentials.tus_endpoint,
        headers: {
          AuthorizationSignature: credentials.authorization_signature,
          AuthorizationExpire: String(credentials.authorization_expire),
          VideoId: credentials.video_id,
          LibraryId: credentials.library_id,
        },
        metadata: { filetype: file.type, filename: file.name },
        onError: (error) => {
          setProgress(null);
          toast.error(`Upload failed: ${error.message}`);
        },
        onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
        onSuccess: () => {
          setProgress(null);
          onVideoUpdate({ status: "PROCESSING", playback_url: null, thumbnail_url: null, duration_seconds: null });
          toast.success("Video uploaded — processing now.");
        },
      });
      upload.start();
    } catch (error) {
      setPreparing(false);
      toast.error(error instanceof ApiError ? error.message : "Failed to start upload.");
    }
  }

  const uploading = preparing || progress !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <VideoStatusBadge status={status} />
        {(status === "PROCESSING" || status === "PENDING") && onRequestRefresh && (
          <button
            type="button"
            onClick={onRequestRefresh}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-150 cursor-pointer"
          >
            <IconRefresh />
            Refresh status
          </button>
        )}
      </div>

      {status === "READY" && attachment.video?.playback_url && (
        <video
          controls
          className="w-full max-w-md rounded-xl"
          src={attachment.video.playback_url}
          poster={attachment.video.thumbnail_url ?? undefined}
        />
      )}

      {status !== "READY" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? <IconSpinner /> : <IconUpload />}
            {status === "FAILED" ? "Retry upload" : "Upload video"}
          </button>
          {progress !== null && (
            <div className="mt-2 w-full max-w-md h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-[#2D6A4F] dark:bg-[#52b788] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
