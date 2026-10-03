import type { VideoStatus } from "@/lib/api/courses.types";
import { Badge } from "@/components/ui/primitives";
import type { Tone } from "@/components/ui/tone";

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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-300" : "bg-amber-300"}`} />
        {isPublished ? "Published" : "Draft"}
      </span>
    );
  }

  return (
    <Badge tone={isPublished ? "success" : "warning"} dot>
      {isPublished ? "Published" : "Draft"}
    </Badge>
  );
}

export const VIDEO_STATUS: Record<VideoStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  PROCESSING: { label: "Processing", tone: "info" },
  READY: { label: "Ready", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const { label, tone } = VIDEO_STATUS[status];
  return (
    <Badge tone={tone} dot pulse={status === "PROCESSING"}>
      {label}
    </Badge>
  );
}
