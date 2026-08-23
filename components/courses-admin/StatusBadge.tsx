import type { VideoStatus } from "@/lib/api/courses.types";

export function PublishedBadge({
  isPublished,
  tone = "surface",
}: {
  isPublished: boolean;
  /** "surface" (default) is for white/gray card backgrounds. "banner" is for the
   *  fixed-color green gradient hero — it stays legible without relying on the
   *  app's light/dark theme, since the banner's own color doesn't change with it. */
  tone?: "surface" | "banner";
}) {
  if (tone === "banner") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-white/15 text-white border border-white/25 backdrop-blur-sm">
        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-300" : "bg-amber-300"}`} />
        {isPublished ? "Published" : "Draft"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${
        isPublished
          ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-[#2D6A4F] dark:bg-[#52b788]" : "bg-amber-500"}`}
      />
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

const VIDEO_STATUS_STYLES: Record<VideoStatus, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  PROCESSING: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  READY: "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
};

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${VIDEO_STATUS_STYLES[status]}`}
    >
      {VIDEO_STATUS_LABELS[status]}
    </span>
  );
}
