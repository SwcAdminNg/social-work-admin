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

export function humanize(value?: string | null): string {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>
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
