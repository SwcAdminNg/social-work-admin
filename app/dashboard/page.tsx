"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconBookOpen,
  IconCertificate,
  IconHash,
  IconLifeBuoy,
  IconMail,
  IconReceipt,
  IconStar,
  IconUserPlus,
  IconUsers,
} from "@/components/dashboard/icons";
import { getAdminDashboardOverview } from "@/lib/api/dashboard-client";
import type { DashboardRecentSignup, DashboardRecentTransaction } from "@/lib/api/dashboard.types";

function naira(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

function signupName(signup: DashboardRecentSignup) {
  return [signup.first_name, signup.last_name].filter(Boolean).join(" ") || "—";
}

function transactionUserName(txn: DashboardRecentTransaction) {
  return txn.user_name || "—";
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatTile({
  label,
  value,
  icon: Icon,
  href,
  attention,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType;
  href?: string;
  attention?: boolean;
}) {
  const className = `group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border no-underline transition-all duration-200 ${
    href ? "hover:shadow-md" : ""
  } ${
    attention
      ? "border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50"
      : "border-gray-200 dark:border-gray-800 hover:border-[#2D6A4F]/40 dark:hover:border-[#52b788]/40"
  }`;

  const content = (
    <>
      <div
        className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
          attention
            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788]"
        }`}
      >
        <Icon />
      </div>
      <div>
        <p
          className={`text-2xl font-extrabold leading-none ${
            attention && Number(value) > 0
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {value}
        </p>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </div>
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function SectionCard({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-[#2D6A4F] dark:text-[#52b788] hover:underline no-underline"
          >
            View all
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-6">{label}</p>;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: () => getAdminDashboardOverview(5),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#2D6A4F] to-[#1e4d38] text-white shadow-lg shadow-green-900/20">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
          Platform overview
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
          Welcome back
        </h2>
        <p className="text-sm text-white/80 max-w-md">
          A snapshot of users, revenue, and the queues that need your attention right now.
        </p>
      </div>

      {isError && (
        <div className="rounded-2xl p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-400">
          Couldn&apos;t load the dashboard overview. Try refreshing the page.
        </div>
      )}

      {/* KPI tile row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Users"
          value={isLoading ? "…" : (data?.users.total_users ?? 0)}
          icon={IconUsers}
          href="/dashboard/user-management"
        />
        <StatTile
          label="Revenue (all time)"
          value={isLoading ? "…" : naira(data?.revenue.total_all_time ?? 0)}
          icon={IconReceipt}
          href="/dashboard/payments"
        />
        <StatTile
          label="Published Courses"
          value={isLoading ? "…" : (data?.courses.published ?? 0)}
          icon={IconBookOpen}
          href="/dashboard/course-management"
        />
        <StatTile
          label="Unassigned Tickets"
          value={isLoading ? "…" : (data?.support.unassigned_open ?? 0)}
          icon={IconAlertTriangle}
          href="/dashboard/help-support/tickets"
          attention
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue card */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6 flex flex-col gap-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Revenue</h3>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                {isLoading ? "…" : naira(data?.revenue.last_7_days ?? 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                {isLoading ? "…" : naira(data?.revenue.last_30_days ?? 0)}
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Active subscriptions</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {isLoading ? "…" : (data?.revenue.active_subscriptions ?? 0)}
            </span>
          </div>
        </div>

        {/* Needs attention panel */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Needs attention</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/dashboard/help-support/tickets"
              className={`flex flex-col gap-1 p-4 rounded-xl no-underline border transition-colors ${
                (data?.support.unassigned_open ?? 0) > 0
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : "bg-gray-50 dark:bg-gray-800/50 border-transparent"
              }`}
            >
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <IconLifeBuoy />
                <span className="text-xs font-medium">Unassigned tickets</span>
              </span>
              <span
                className={`text-xl font-extrabold ${
                  (data?.support.unassigned_open ?? 0) > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {isLoading ? "…" : (data?.support.unassigned_open ?? 0)}
              </span>
            </Link>

            <Link
              href="/dashboard/reviews"
              className={`flex flex-col gap-1 p-4 rounded-xl no-underline border transition-colors ${
                (data?.reviews.pending_reply ?? 0) > 0
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : "bg-gray-50 dark:bg-gray-800/50 border-transparent"
              }`}
            >
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <IconStar />
                <span className="text-xs font-medium">Reviews awaiting reply</span>
              </span>
              <span
                className={`text-xl font-extrabold ${
                  (data?.reviews.pending_reply ?? 0) > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {isLoading ? "…" : (data?.reviews.pending_reply ?? 0)}
              </span>
            </Link>

            <Link
              href="/dashboard/contact-messages"
              className={`flex flex-col gap-1 p-4 rounded-xl no-underline border transition-colors ${
                (data?.contact_messages.recent_7_days ?? 0) > 0
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : "bg-gray-50 dark:bg-gray-800/50 border-transparent"
              }`}
            >
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <IconMail />
                <span className="text-xs font-medium">Recent contact messages</span>
              </span>
              <span
                className={`text-xl font-extrabold ${
                  (data?.contact_messages.recent_7_days ?? 0) > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {isLoading ? "…" : (data?.contact_messages.recent_7_days ?? 0)}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top courses widget */}
        <SectionCard title="Top Enrolled Courses" viewAllHref="/dashboard/course-management">
          {isLoading ? (
            <EmptyRow label="Loading…" />
          ) : !data?.top_enrolled_courses.length ? (
            <EmptyRow label="No published courses yet." />
          ) : (
            <ul className="flex flex-col list-none m-0 p-0">
              {data.top_enrolled_courses.map((course, i) => (
                <li
                  key={course.course_id}
                  className={`${
                    i !== data.top_enrolled_courses.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }`}
                >
                  <Link
                    href={`/dashboard/course-management/${course.course_id}`}
                    className="flex items-center gap-3 py-3 no-underline"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {course.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">
                      {course.title}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {course.enrollment_count} enrolled
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Recent signups */}
        <SectionCard title="Recent Signups" viewAllHref="/dashboard/user-management">
          {isLoading ? (
            <EmptyRow label="Loading…" />
          ) : !data?.recent_signups.length ? (
            <EmptyRow label="No new signups yet." />
          ) : (
            <ul className="flex flex-col list-none m-0 p-0">
              {data.recent_signups.map((signup: DashboardRecentSignup, i) => (
                <li
                  key={signup.id}
                  className={`${
                    i !== data.recent_signups.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }`}
                >
                  <Link
                    href={`/dashboard/user-management/${signup.id}`}
                    className="flex items-center gap-3 py-3 no-underline"
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center">
                      <IconUserPlus />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 min-w-0">
                      {signupName(signup)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
                      {timeAgo(signup.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Recent transactions */}
        <SectionCard title="Recent Transactions" viewAllHref="/dashboard/payments">
          {isLoading ? (
            <EmptyRow label="Loading…" />
          ) : !data?.recent_transactions.length ? (
            <EmptyRow label="No transactions yet." />
          ) : (
            <ul className="flex flex-col list-none m-0 p-0">
              {data.recent_transactions.map((txn: DashboardRecentTransaction, i) => (
                <li
                  key={txn.id}
                  className={`flex items-center justify-between gap-3 py-3 ${
                    i !== data.recent_transactions.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{transactionUserName(txn)}</p>
                    <p className="text-[0.7rem] text-gray-400 dark:text-gray-600">{timeAgo(txn.created_at)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                    {naira(txn.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Certificates Issued"
          value={isLoading ? "…" : (data?.certificates_issued_total ?? 0)}
          icon={IconCertificate}
        />
        <StatTile
          label="Active Coupons"
          value={isLoading ? "…" : (data?.active_coupons ?? 0)}
          icon={IconHash}
          href="/dashboard/payments/coupons"
        />
        <StatTile
          label="Draft Courses"
          value={isLoading ? "…" : (data?.courses.draft ?? 0)}
          icon={IconBookOpen}
          href="/dashboard/course-management"
        />
      </div>
    </div>
  );
}
