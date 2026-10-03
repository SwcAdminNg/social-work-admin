import {
  BookMarked,
  Briefcase,
  ClipboardList,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartHandshake,
  Link2,
  Lock,
  PlayCircle,
  Scale,
  UsersRound,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/ui/tone";
import type { ResourceAttachment, ResourceAttachmentType, ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { CATEGORY_OPTIONS, VISIBILITY_OPTIONS } from "@/components/resources-admin/constants";

export const RESOURCE_CATEGORY_ICONS: Record<ResourceCategory, LucideIcon> = {
  COURSE_MATERIALS: GraduationCap,
  PRACTICE_RESOURCES: HeartHandshake,
  POLICIES_AND_GUIDANCE: Scale,
  TEMPLATES_AND_FORMS: ClipboardList,
  VIDEOS_AND_WEBINARS: Video,
  RESEARCH_AND_PUBLICATIONS: FlaskConical,
  CAREER_AND_CPD: Briefcase,
  USEFUL_LINKS: Link2,
};

export const RESOURCE_CATEGORIES = CATEGORY_OPTIONS.map((o) => ({ ...o, icon: RESOURCE_CATEGORY_ICONS[o.value] }));

export const VISIBILITY_META: Record<ResourceVisibility, { label: string; hint: string; icon: LucideIcon; tone: Tone }> =
  Object.fromEntries(
    VISIBILITY_OPTIONS.map((o) => [
      o.value,
      {
        label: o.label,
        hint: o.hint,
        icon: o.value === "PUBLIC" ? Globe : o.value === "LOGGED_IN" ? UsersRound : Lock,
        tone: (o.value === "PUBLIC" ? "info" : o.value === "LOGGED_IN" ? "violet" : "warning") as Tone,
      },
    ]),
  ) as Record<ResourceVisibility, { label: string; hint: string; icon: LucideIcon; tone: Tone }>;

export const ATTACHMENT_META: Record<ResourceAttachmentType, { label: string; noun: string; icon: LucideIcon; tone: Tone; description: string }> = {
  VIDEO: {
    label: "Video",
    noun: "video",
    icon: PlayCircle,
    tone: "violet",
    description: "A recorded talk, webinar or walkthrough. Streamed in the best quality for each viewer.",
  },
  DOCUMENT: {
    label: "Document",
    noun: "document",
    icon: FileText,
    tone: "info",
    description: "A PDF, policy, template or worksheet people can read or download.",
  },
  LINKS: {
    label: "Link",
    noun: "link",
    icon: Link2,
    tone: "neutral",
    description: "Point people to guidance, an article or a tool on another site.",
  },
};

export const RESOURCE_ICON = BookMarked;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Problems that make an attachment unusable for learners. */
export function attachmentIssue(a: ResourceAttachment): string | null {
  if (a.attachment_type === "VIDEO") {
    if (a.video?.status === "FAILED") return "The video couldn't be processed";
    if (!a.video || (a.video.status === "PENDING" && !a.video.bunny_video_guid)) return "No video uploaded yet";
  }
  if (a.attachment_type === "DOCUMENT" && !a.document?.is_uploaded) return "The file never finished uploading";
  if (a.attachment_type === "LINKS" && !a.link?.url) return "No web address";
  return null;
}
