import Link from "next/link";

export const roleOptions = [
  "INSTRUCTOR",
  "CONTENT_DEVELOPER",
  "ACADEMIC_REVIEWER",
  "ASSESSMENT_MODERATOR",
  "QA_REVIEWER",
  "COURSE_LEAD",
  "LEAD_ASSESSOR",
  "HEAD_OF_LEARNING",
  "PLATFORM_ADMIN",
] as const;

export const roleDetails: Record<(typeof roleOptions)[number], { group: "Authoring" | "Review" | "Approval"; description: string }> = {
  INSTRUCTOR: { group: "Authoring", description: "Teaches and authors course content." },
  CONTENT_DEVELOPER: { group: "Authoring", description: "Builds draft content and submits it for review." },
  ACADEMIC_REVIEWER: { group: "Review", description: "Reviews course changes for academic quality." },
  ASSESSMENT_MODERATOR: { group: "Review", description: "Moderates essay marks and assessments." },
  QA_REVIEWER: { group: "Review", description: "Runs quality checks before approval." },
  COURSE_LEAD: { group: "Approval", description: "Approves course changes and owns the course." },
  LEAD_ASSESSOR: { group: "Approval", description: "Signs off final assessment results." },
  HEAD_OF_LEARNING: { group: "Approval", description: "Final approval on high-risk changes." },
  PLATFORM_ADMIN: { group: "Approval", description: "Full governance powers across the platform." },
};

const DAY_MS = 86_400_000;

/** Short, human relative time such as "in 3 days", "2 hours ago", "today". */
export function relativeTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < DAY_MS) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 30 * DAY_MS) return rtf.format(Math.round(diff / DAY_MS), "day");
  if (abs < 365 * DAY_MS) return rtf.format(Math.round(diff / (30 * DAY_MS)), "month");
  return rtf.format(Math.round(diff / (365 * DAY_MS)), "year");
}

/** Days until the date (negative when in the past), or null when missing. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return (time - Date.now()) / DAY_MS;
}

export function initialsOf(name?: string | null): string {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({ name, size = "md" }: { name?: string | null; size?: "sm" | "md" }) {
  const sizes = size === "sm" ? "h-6 w-6 text-[0.6rem]" : "h-9 w-9 text-xs";
  return (
    <span
      className={`${sizes} inline-flex shrink-0 items-center justify-center rounded-full bg-[#2D6A4F]/10 font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-1/5 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="hidden h-6 w-24 rounded-full bg-gray-100 sm:block dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

export function humanize(value?: string | null): string {
  if (!value) return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => (part === "qa" ? "QA" : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue";
}) {
  const classes = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  }[tone];

  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>
      {children}
    </span>
  );
}

export function riskTone(risk?: string | null): "gray" | "green" | "amber" | "red" {
  if (risk === "HIGH") return "red";
  if (risk === "MEDIUM") return "amber";
  if (risk === "LOW") return "green";
  return "gray";
}

export function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 ${className}`}>
      {children}
    </div>
  );
}

export function ItemLink({ kind, id, children }: { kind: string; id: string; children: React.ReactNode }) {
  const href =
    kind === "ESSAY_MARK"
      ? `/dashboard/approval-centre/marks/${id}`
      : `/dashboard/approval-centre/revisions/${id}`;
  return (
    <Link href={href} className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline no-underline">
      {children}
    </Link>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800/70" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
            value === option.value
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
