"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { claimRevision, getApprovalCentreCounts, listApprovalCentre, publishRevision } from "@/lib/api/governance-client";
import type { ApprovalCentreCounts, ApprovalCentreRow, ApprovalCentreView, ApprovalItemKind } from "@/lib/api/governance.types";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { Pagination } from "@/components/generic/ui/Pagination";
import { IconClipboardCheck, IconDocument, IconRefresh, IconSpinner } from "@/components/dashboard/icons";
import {
  Avatar,
  Badge,
  daysUntil,
  DashboardCard,
  formatDate,
  humanize,
  relativeTime,
  riskTone,
  Segmented,
  SkeletonRows,
} from "./GovernanceUtils";
import { CourseSearchSelect, type SelectedCourse } from "./SearchSelects";

const PAGE_SIZE = 20;
const VIEW_STORAGE_KEY = "approval-centre:view";

type Queue = { key: ApprovalCentreView; label: string; hint: string; countKey: keyof ApprovalCentreCounts; tone: "green" | "amber" | "red" | "blue" };

const queues: Queue[] = [
  { key: "awaiting_me", label: "Awaiting me", hint: "Needs your review", countKey: "awaiting_me", tone: "green" },
  { key: "returned_to_me", label: "Returned", hint: "Sent back for changes", countKey: "returned_to_me", tone: "amber" },
  { key: "overdue", label: "Overdue", hint: "Past due date", countKey: "overdue", tone: "red" },
  { key: "ready_to_publish", label: "Ready to publish", hint: "Approved, not yet live", countKey: "ready_to_publish", tone: "blue" },
];

const history: { key: ApprovalCentreView; label: string }[] = [
  { key: "recently_approved", label: "Approved" },
  { key: "recently_rejected", label: "Rejected" },
  { key: "my_drafts", label: "My drafts" },
];

const allViews = [...queues.map((q) => q.key), ...history.map((h) => h.key)];

const emptyCopy: Record<ApprovalCentreView, { title: string; body: string }> = {
  awaiting_me: { title: "You're all caught up", body: "Nothing is waiting on your review right now." },
  returned_to_me: { title: "Nothing returned", body: "No reviewers have sent work back to you." },
  overdue: { title: "Nothing overdue", body: "Every review is on schedule." },
  ready_to_publish: { title: "Nothing to publish", body: "Approved work will show up here, ready to go live." },
  recently_approved: { title: "No recent approvals", body: "Approved items will appear here." },
  recently_rejected: { title: "No recent rejections", body: "Rejected items will appear here." },
  my_drafts: { title: "No drafts", body: "Course revisions you start will appear here." },
};

const toneRing = {
  green: "ring-brand-600 dark:ring-brand-400",
  amber: "ring-amber-500",
  red: "ring-red-500",
  blue: "ring-sky-500",
};
const toneText = {
  green: "text-brand-600 dark:text-brand-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  blue: "text-sky-600 dark:text-sky-400",
};

function isView(value: unknown): value is ApprovalCentreView {
  return allViews.includes(value as ApprovalCentreView);
}

function noopSubscribe() {
  return () => {};
}

function readStoredView(): string | null {
  try {
    return sessionStorage.getItem(VIEW_STORAGE_KEY);
  } catch {
    return null;
  }
}

function detailHref(row: Pick<ApprovalCentreRow, "kind" | "id">) {
  return row.kind === "ESSAY_MARK" ? `/dashboard/approval-centre/marks/${row.id}` : `/dashboard/approval-centre/revisions/${row.id}`;
}

export function ApprovalCentre({ initialView }: { initialView?: string }) {
  const queryClient = useQueryClient();
  // An explicit choice (URL or click) wins; otherwise come back to the tab used last in this browser session,
  // e.g. after "Back to Approval Centre" on a detail page.
  const [chosenView, setChosenView] = useState<ApprovalCentreView | null>(
    isView(initialView) ? initialView : null,
  );
  const storedView = useSyncExternalStore(noopSubscribe, readStoredView, () => null);
  const view: ApprovalCentreView = chosenView ?? (isView(storedView) ? storedView : "awaiting_me");
  const [kind, setKind] = useState<ApprovalItemKind | "">("");
  const [course, setCourse] = useState<SelectedCourse | null>(null);
  const [page, setPage] = useState(1);
  const [publishing, setPublishing] = useState<ApprovalCentreRow | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
  }, [view]);

  const params = { view, kind, course_id: course?.id, page, page_size: PAGE_SIZE };

  const list = useQuery({
    queryKey: ["approval-centre", "list", params],
    queryFn: () => listApprovalCentre(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const counts = useQuery({
    queryKey: ["approval-centre", "counts"],
    queryFn: getApprovalCentreCounts,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (list.isError) toast.error(list.error instanceof ApiError ? list.error.message : "Failed to load Approval Centre.");
  }, [list.isError, list.error]);

  const publish = useMutation({
    mutationFn: (row: ApprovalCentreRow) => publishRevision(row.id),
    onSuccess: (_, row) => {
      toast.success(`"${row.item_title}" is now live.`);
      setPublishing(null);
      queryClient.invalidateQueries({ queryKey: ["approval-centre"] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to publish."),
  });

  function changeView(next: ApprovalCentreView) {
    setChosenView(next);
    setPage(1);
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["approval-centre"] });
  }

  const rows = list.data?.items ?? [];
  const awaiting = counts.data?.awaiting_me ?? 0;
  const overdue = counts.data?.overdue ?? 0;
  const hasFilters = !!(kind || course);
  const refreshing = (list.isFetching || counts.isFetching) && !list.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Approval Centre</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {counts.data
              ? awaiting > 0
                ? `${awaiting} item${awaiting === 1 ? "" : "s"} waiting on you${overdue ? ` · ${overdue} overdue` : ""}.`
                : "Nothing waiting on you — nice work."
              : "Course revisions and essay marks that need your attention."}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-ink-line dark:bg-ink-surface dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Refresh"
        >
          <IconRefresh className={refreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {queues.map((q) => {
          const active = view === q.key;
          const count = counts.data?.[q.countKey];
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => changeView(q.key)}
              aria-pressed={active}
              className={`rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-ink-surface ${
                active ? `border-transparent shadow-md ring-2 ${toneRing[q.tone]}` : "border-slate-200 dark:border-ink-line"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{q.label}</span>
              <span className={`mt-1 block text-3xl font-extrabold tracking-tight ${count ? toneText[q.tone] : "text-slate-300 dark:text-slate-600"}`}>
                {count ?? <span className="inline-block h-8 w-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">{q.hint}</span>
            </button>
          );
        })}
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-ink-line lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">History</span>
            {history.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => changeView(h.key)}
                aria-pressed={view === h.key}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === h.key
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:ml-auto">
            <Segmented
              value={kind}
              onChange={(next) => {
                setKind(next);
                setPage(1);
              }}
              options={[
                { value: "", label: "All" },
                { value: "COURSE_REVISION", label: "Revisions" },
                { value: "ESSAY_MARK", label: "Essay marks" },
              ]}
            />
            <div className="sm:w-64">
              <CourseSearchSelect
                value={course}
                onChange={(next) => {
                  setCourse(next);
                  setPage(1);
                }}
                placeholder="Any course"
              />
            </div>
          </div>
        </div>

        {list.isLoading ? (
          <SkeletonRows rows={6} />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-400">
              <IconClipboardCheck />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">{hasFilters ? "No matches" : emptyCopy[view].title}</p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {hasFilters ? "Nothing in this view matches your filters." : emptyCopy[view].body}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setKind("");
                  setCourse(null);
                  setPage(1);
                }}
                className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className={`divide-y divide-slate-100 transition-opacity dark:divide-ink-line ${list.isFetching ? "opacity-70" : ""}`}>
            {rows.map((row) => (
              <ApprovalRow key={`${row.kind}-${row.id}`} row={row} onPublish={() => setPublishing(row)} />
            ))}
          </ul>
        )}

        {list.data && list.data.meta.total_pages > 1 && (
          <div className="border-t border-slate-200 dark:border-ink-line">
            <Pagination currentPage={page} totalPages={list.data.meta.total_pages} onPageChange={setPage} />
          </div>
        )}
      </DashboardCard>

      <ConfirmModal
        isOpen={!!publishing}
        onClose={() => setPublishing(null)}
        onConfirm={() => publishing && publish.mutate(publishing)}
        isLoading={publish.isPending}
        title="Publish this revision?"
        confirmText="Publish now"
        description={
          <>
            <strong className="text-slate-900 dark:text-white">{publishing?.item_title}</strong>
            {publishing?.version_label ? ` (v${publishing.version_label})` : ""} will go live to learners on{" "}
            {publishing?.course_title ?? "this course"} immediately.
          </>
        }
      />
    </div>
  );
}

function DueLabel({ row }: { row: ApprovalCentreRow }) {
  const days = daysUntil(row.due_at);
  if (days === null) return <span className="text-slate-400 dark:text-slate-500">No due date</span>;
  const overdue = row.is_overdue || days < 0;
  const soon = !overdue && days <= 2;
  const lateDays = Math.round(-days);
  return (
    <span
      title={formatDate(row.due_at)}
      className={`whitespace-nowrap font-semibold ${overdue ? "text-red-600 dark:text-red-400" : soon ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"}`}
    >
      {overdue ? (lateDays >= 1 ? `${lateDays} day${lateDays === 1 ? "" : "s"} overdue` : "Overdue") : `Due ${relativeTime(row.due_at)}`}
    </span>
  );
}

function ApprovalRow({ row, onPublish }: { row: ApprovalCentreRow; onPublish: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const href = detailHref(row);
  const actions = row.available_actions ?? [];
  const isRevision = row.kind === "COURSE_REVISION";
  const canClaim = isRevision && actions.includes("CLAIM");
  const canPublish = isRevision && actions.includes("PUBLISH");
  const overdue = row.is_overdue || (daysUntil(row.due_at) ?? 0) < 0;

  const claim = useMutation({
    mutationFn: () => claimRevision(row.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-centre"] });
      router.push(href);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to claim."),
  });

  return (
    <li
      className={`group relative grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:px-5 lg:grid-cols-[auto_minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1fr)_8.5rem] dark:hover:bg-slate-800/30 ${
        overdue ? "shadow-[inset_3px_0_0_0_rgb(239_68_68)]" : ""
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          isRevision ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        }`}
        title={humanize(row.kind)}
      >
        {isRevision ? <IconDocument /> : <IconClipboardCheck />}
      </span>

      <div className="col-span-2 min-w-0 lg:col-span-1">
        {/* Stretched link: the whole row opens the item, action buttons sit above it. */}
        <Link href={href} className="block truncate text-sm font-semibold text-slate-900 no-underline after:absolute after:inset-0 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          {row.item_title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="truncate">{row.course_title ?? row.course_id}</span>
          {row.version_label && <span>· v{row.version_label}</span>}
          {row.submitted_by?.name && <span>· by {row.submitted_by.name}</span>}
          {row.risk && <Badge tone={riskTone(row.risk)}>{humanize(row.risk)} risk</Badge>}
        </div>
      </div>

      <div className="col-start-2 row-start-2 min-w-0 text-sm lg:col-start-auto lg:row-start-auto">
        <span className="block font-semibold text-slate-800 dark:text-slate-200">{humanize(row.current_stage ?? row.status)}</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 lg:hidden">
          <DueLabel row={row} />
        </span>
        {row.decision && <span className="text-xs text-slate-500 dark:text-slate-400">{humanize(row.decision)}</span>}
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
        {row.reviewer?.name ? (
          <>
            <Avatar name={row.reviewer.name} size="sm" />
            <span className="truncate text-slate-700 dark:text-slate-300">{row.reviewer.name}</span>
          </>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
        )}
      </div>

      <div className="hidden text-sm lg:block">
        <DueLabel row={row} />
      </div>

      <div className="relative z-10 col-start-3 row-start-2 flex justify-end self-end lg:col-start-auto lg:row-start-auto lg:self-auto">
        {canPublish ? (
          <button
            type="button"
            onClick={onPublish}
            className="whitespace-nowrap rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Publish
          </button>
        ) : canClaim ? (
          <button
            type="button"
            onClick={() => claim.mutate()}
            disabled={claim.isPending}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {claim.isPending && <IconSpinner />}
            Claim & review
          </button>
        ) : (
          <Link
            href={href}
            className="whitespace-nowrap rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-700 no-underline transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-400"
          >
            {actions.length > 0 ? "Review" : "Open"}
          </Link>
        )}
      </div>
    </li>
  );
}
