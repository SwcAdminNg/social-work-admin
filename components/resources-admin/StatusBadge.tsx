import type { ResourceVideoStatus, ResourceVisibility } from "@/lib/api/resources.types";
import { Badge } from "@/components/ui/primitives";
import type { Tone } from "@/components/ui/tone";
import { visibilityLabel } from "./constants";

export { PublishedBadge } from "@/components/courses-admin/StatusBadge";

const VIDEO_STATUS: Record<ResourceVideoStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  PROCESSING: { label: "Processing", tone: "info" },
  READY: { label: "Ready", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

export function VideoStatusBadge({ status }: { status: ResourceVideoStatus }) {
  const { label, tone } = VIDEO_STATUS[status];
  return (
    <Badge tone={tone} dot pulse={status === "PROCESSING"}>
      {label}
    </Badge>
  );
}

const VISIBILITY_TONES: Record<ResourceVisibility, Tone> = {
  PUBLIC: "info",
  LOGGED_IN: "violet",
  COURSE_ENROLLED: "warning",
};

export function VisibilityBadge({ visibility }: { visibility: ResourceVisibility }) {
  return <Badge tone={VISIBILITY_TONES[visibility]}>{visibilityLabel(visibility)}</Badge>;
}
