import type { CourseCategory, CourseLevel } from "@/lib/api/courses.types";

export const CATEGORY_OPTIONS: { value: CourseCategory; label: string }[] = [
  { value: "DEVELOPMENT", label: "Development" },
  { value: "BUSINESS", label: "Business" },
  { value: "FINANCE_ACCOUNTING", label: "Finance & Accounting" },
  { value: "IT_SOFTWARE", label: "IT & Software" },
  { value: "OFFICE_PRODUCTIVITY", label: "Office Productivity" },
  { value: "PERSONAL_DEVELOPMENT", label: "Personal Development" },
  { value: "DESIGN", label: "Design" },
  { value: "MARKETING", label: "Marketing" },
  { value: "HEALTH_FITNESS", label: "Health & Fitness" },
  { value: "MUSIC", label: "Music" },
  { value: "TEACHING_ACADEMICS", label: "Teaching & Academics" },
  { value: "PHOTOGRAPHY_VIDEO", label: "Photography & Video" },
  { value: "LIFESTYLE", label: "Lifestyle" },
  { value: "LANGUAGE", label: "Language" },
];

export const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function categoryLabel(value: CourseCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function levelLabel(value: CourseLevel): string {
  return LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
