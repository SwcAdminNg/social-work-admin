import type { ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";

export const CATEGORY_OPTIONS: { value: ResourceCategory; label: string }[] = [
  { value: "COURSE_MATERIALS", label: "Course Materials" },
  { value: "PRACTICE_RESOURCES", label: "Practice Resources" },
  { value: "POLICIES_AND_GUIDANCE", label: "Policies & Guidance" },
  { value: "TEMPLATES_AND_FORMS", label: "Templates & Forms" },
  { value: "VIDEOS_AND_WEBINARS", label: "Videos & Webinars" },
  { value: "RESEARCH_AND_PUBLICATIONS", label: "Research & Publications" },
  { value: "CAREER_AND_CPD", label: "Career & CPD" },
  { value: "USEFUL_LINKS", label: "Useful Links" },
];

export const VISIBILITY_OPTIONS: { value: ResourceVisibility; label: string; hint: string }[] = [
  { value: "PUBLIC", label: "Public", hint: "Anyone can see it, including anonymous visitors." },
  { value: "LOGGED_IN", label: "Logged-in users", hint: "Any authenticated user, of any role." },
  {
    value: "COURSE_ENROLLED",
    label: "Course-enrolled",
    hint: "Only users with access to the tied course (plus admins and the course's instructor).",
  },
];

export function categoryLabel(value: ResourceCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function visibilityLabel(value: ResourceVisibility): string {
  return VISIBILITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
