"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  LifeBuoy,
  Mail,
  PencilLine,
  Star,
  Ticket,
  TrendingUp,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, Callout, Card, CardHeader, Skeleton, StatCard } from "@/components/ui/primitives";
import type { Tone } from "@/components/ui/tone";
import { AttentionList, type AttentionItem } from "@/components/dashboard/home/AttentionList";
import { HomeHero } from "@/components/dashboard/home/HomeHero";
import { getAdminDashboardOverview } from "@/lib/api/dashboard-client";
import type { AdminDashboardOverview, DashboardRecentSignup } from "@/lib/api/dashboard.types";
import type { TransactionStatus } from "@/lib/api/payments.types";

const fmt = (n?: number) => new Intl.NumberFormat("en-NG").format(Number(n ?? 0));

function naira(amount?: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    Number(amount ?? 0),
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

function signupName(signup: DashboardRecentSignup) {
  return [signup.first_name, signup.last_name].filter(Boolean).join(" ") || signup.email || "—";
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

const TXN_STATUS: Record<TransactionStatus, { label: string; tone: Tone }> = {
  SUCCESS: { label: "Paid", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
};

const USER_TYPE: Record<DashboardRecentSignup["user_type"], { label: string; tone: Tone }> = {
  USER: { label: "Learner", tone: "neutral" },
  INSTRUCTOR: { label: "Instructor", tone: "violet" },
  ADMIN: { label: "Admin", tone: "brand" },
};

/* ───────────── Building blocks ───────────── */

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300"
    >
      View all <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2.5 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-ink-line dark:text-slate-400">
      {children}
    </p>
  );
}

function Metric({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate font-display text-base font-extrabold text-slate-900 dark:text-white">
          {value}
          {hint && <span className="ml-1.5 text-xs font-medium text-slate-400">{hint}</span>}
        </p>
      </div>
    </div>
  );
}

/* ───────────── Derived content ───────────── */

function attentionItems(data: AdminDashboardOverview): AttentionItem[] {
  const items: AttentionItem[] = [];
  const unassigned = data.support.unassigned_open;
  if (unassigned > 0) {
    items.push({
      key: "tickets",
      tone: "danger",
      icon: LifeBuoy,
      eyebrow: "Support",
      title: `${plural(unassigned, "ticket")} waiting for an owner`,
      description: `${fmt(data.support.open)} open · ${fmt(data.support.in_progress)} in progress`,
      href: "/dashboard/help-support/tickets",
      cta: "Assign",
    });
  }
  const pendingReviews = data.reviews.pending_reply;
  if (pendingReviews > 0) {
    items.push({
      key: "reviews",
      tone: "warning",
      icon: Star,
      eyebrow: "Reviews",
      title: `${plural(pendingReviews, "review")} awaiting a reply`,
      description: `Platform average ${data.reviews.platform_average_rating.toFixed(1)} from ${plural(data.reviews.total_reviews, "review")}`,
      href: "/dashboard/reviews",
      cta: "Reply",
    });
  }
  const recentContacts = data.contact_messages.recent_7_days;
  if (recentContacts > 0) {
    items.push({
      key: "contact",
      tone: "info",
      icon: Mail,
      eyebrow: "Contact messages",
      title: `${plural(recentContacts, "new message")} this week`,
      description: `${fmt(data.contact_messages.total)} received in total`,
      href: "/dashboard/contact-messages",
      cta: "Read",
    });
  }
  if (data.courses.draft > 0) {
    items.push({
      key: "drafts",
      tone: "brand",
      icon: PencilLine,
      eyebrow: "Courses",
      title: `${plural(data.courses.draft, "course")} still in draft`,
      description: "Finish and publish them so learners can enrol.",
      href: "/dashboard/course-management",
      cta: "Continue",
    });
  }
  return items;
}

function summaryFor(data: AdminDashboardOverview) {
  const urgent: string[] = [];
  if (data.support.unassigned_open)
    urgent.push(`${plural(data.support.unassigned_open, "support ticket")} ${data.support.unassigned_open === 1 ? "needs" : "need"} an owner`);
  if (data.reviews.pending_reply)
    urgent.push(`${plural(data.reviews.pending_reply, "review")} ${data.reviews.pending_reply === 1 ? "is" : "are"} awaiting a reply`);
  if (urgent.length) {
    const s = urgent.join(" and ");
    return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
  }
  if (data.users.new_last_7_days)
    return `${plural(data.users.new_last_7_days, "new member")} joined this week, and nothing urgent is waiting on you.`;
  return "You're all caught up. Here's how the platform is doing today.";
}

/* ───────────── Page ───────────── */

export default function DashboardPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.userType === "ADMIN";
  const isStaff = isAdmin || session?.user?.userType === "INSTRUCTOR";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard", "overview"],
    queryFn: () => getAdminDashboardOverview(5),
  });

  // StatCard renders the value inside a <p>, so the placeholder must be inline.
  const loadingValue = (
    <span className="inline-block h-7 w-20 animate-shimmer rounded-lg bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_0%,rgba(148,163,184,0.24)_50%,rgba(148,163,184,0.12)_100%)] bg-[length:800px_100%] align-middle" />
  );
  const items = data ? attentionItems(data) : [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <HomeHero
        firstName={session?.user?.firstName}
        summary={
          data
            ? summaryFor(data)
            : "A snapshot of users, revenue and the queues that need your attention right now."
        }
        canCreate={isAdmin}
        showApprovals={isStaff}
      />

      {isError && (
        <Callout tone="danger" icon={AlertTriangle} title="Couldn't load the dashboard overview">
          Try refreshing the page. If this keeps happening, check the API status.
        </Callout>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={isLoading ? loadingValue : fmt(data?.users.total_users)}
          hint={data ? `+${fmt(data.users.new_last_7_days)} this week · ${fmt(data.users.instructors)} instructors` : undefined}
          icon={UsersRound}
          tone="brand"
          href="/dashboard/user-management"
        />
        <StatCard
          label="Revenue (30 days)"
          value={isLoading ? loadingValue : naira(data?.revenue.last_30_days)}
          hint={data ? `${naira(data.revenue.total_all_time)} all time` : undefined}
          icon={Wallet}
          tone="success"
          href="/dashboard/payments"
        />
        <StatCard
          label="Published courses"
          value={isLoading ? loadingValue : fmt(data?.courses.published)}
          hint={data ? `${fmt(data.courses.draft)} in draft · ${fmt(data.courses.total)} total` : undefined}
          icon={BookOpen}
          tone="info"
          href="/dashboard/course-management"
        />
        <StatCard
          label="Unassigned tickets"
          value={isLoading ? loadingValue : fmt(data?.support.unassigned_open)}
          hint={data ? (data.support.unassigned_open ? `${fmt(data.support.open)} open in total` : "Queue is clear") : undefined}
          icon={LifeBuoy}
          tone={data?.support.unassigned_open ? "danger" : "neutral"}
          href="/dashboard/help-support/tickets"
        />
      </div>

      {/* Attention + revenue */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card>
              <CardHeader title="Needs your attention" className="mb-4" />
              <ListSkeleton rows={3} />
            </Card>
          ) : (
            <AttentionList items={items} total={items.length} emptyHint="No unassigned tickets, unanswered reviews or new messages." />
          )}
        </div>

        <Card className="flex flex-col">
          <CardHeader title="Revenue" description="Successful payments across courses and subscriptions." icon={TrendingUp} className="mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</p>
              <div className="mt-1 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {isLoading ? <Skeleton className="h-6 w-20" /> : naira(data?.revenue.last_7_days)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</p>
              <div className="mt-1 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                {isLoading ? <Skeleton className="h-6 w-20" /> : naira(data?.revenue.last_30_days)}
              </div>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-ink-line">
            <span className="text-slate-500 dark:text-slate-400">Active subscriptions</span>
            <span className="font-bold text-slate-900 dark:text-white">{isLoading ? "…" : fmt(data?.revenue.active_subscriptions)}</span>
          </div>
        </Card>
      </div>

      {/* Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Top enrolled courses" className="mb-4" actions={<ViewAll href="/dashboard/course-management" />} />
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.top_enrolled_courses.length ? (
            <EmptyLine>No published courses yet.</EmptyLine>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {data.top_enrolled_courses.map((course, i) => (
                <li key={course.course_id}>
                  <Link
                    href={`/dashboard/course-management/${course.course_id}`}
                    className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 no-underline transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  >
                    <span className="w-4 flex-shrink-0 text-center font-display text-xs font-extrabold text-slate-400">{i + 1}</span>
                    <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-400/20 dark:to-brand-400/5">
                      {course.thumbnail_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                      {course.title}
                    </span>
                    <Badge size="xs" tone="brand">
                      {fmt(course.enrollment_count)}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent signups" className="mb-4" actions={<ViewAll href="/dashboard/user-management" />} />
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.recent_signups.length ? (
            <EmptyLine>No new signups yet.</EmptyLine>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {data.recent_signups.map((signup) => {
                const type = USER_TYPE[signup.user_type] ?? USER_TYPE.USER;
                return (
                  <li key={signup.id}>
                    <Link
                      href={`/dashboard/user-management/${signup.id}`}
                      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 no-underline transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    >
                      <Avatar name={signupName(signup)} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                          {signupName(signup)}
                        </span>
                        <span className="block text-xs text-slate-400 dark:text-slate-500">{timeAgo(signup.created_at)}</span>
                      </span>
                      <Badge size="xs" tone={type.tone}>
                        {type.label}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent transactions" className="mb-4" actions={<ViewAll href="/dashboard/payments" />} />
          {isLoading ? (
            <ListSkeleton />
          ) : !data?.recent_transactions.length ? (
            <EmptyLine>No transactions yet.</EmptyLine>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {data.recent_transactions.map((txn) => {
                const status = TXN_STATUS[txn.status] ?? { label: txn.status, tone: "neutral" as Tone };
                return (
                  <li key={txn.id} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                      <Wallet className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {txn.user_name || "—"}
                      </span>
                      <span className="block text-xs text-slate-400 dark:text-slate-500">{timeAgo(txn.created_at)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{naira(txn.amount)}</span>
                      <Badge size="xs" tone={status.tone}>
                        {status.label}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Platform snapshot */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Platform snapshot</h2>
        <Card className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={BadgeCheck}
            label="Certificates issued"
            value={fmt(data?.certificates_issued_total)}
            hint={data?.certificates_issued_last_30_days ? `+${fmt(data.certificates_issued_last_30_days)} this month` : undefined}
          />
          <Metric icon={Ticket} label="Active coupons" value={fmt(data?.active_coupons)} />
          <Metric
            icon={Star}
            label="Average rating"
            value={data ? data.reviews.platform_average_rating.toFixed(1) : "—"}
            hint={data ? `${fmt(data.reviews.total_reviews)} reviews` : undefined}
          />
          <Metric
            icon={UsersRound}
            label="Suspended accounts"
            value={fmt(data?.users.suspended)}
            hint={data ? `${fmt(data.users.new_last_30_days)} joined this month` : undefined}
          />
        </Card>
      </section>
    </div>
  );
}
