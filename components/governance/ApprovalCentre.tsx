"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getApprovalCentreCounts, listApprovalCentre } from "@/lib/api/governance-client";
import type {
  ApprovalCentreCounts,
  ApprovalCentreRow,
  ApprovalCentreView,
  ApprovalItemKind,
  PaginatedResult,
} from "@/lib/api/governance.types";
import { Pagination } from "@/components/generic/ui/Pagination";
import { Badge, DashboardCard, formatDate, humanize, ItemLink, riskTone } from "./GovernanceUtils";

const views: { key: ApprovalCentreView; label: string; countKey?: keyof ApprovalCentreCounts }[] = [
  { key: "awaiting_me", label: "Awaiting me", countKey: "awaiting_me" },
  { key: "returned_to_me", label: "Returned", countKey: "returned_to_me" },
  { key: "overdue", label: "Overdue", countKey: "overdue" },
  { key: "ready_to_publish", label: "Ready", countKey: "ready_to_publish" },
  { key: "recently_approved", label: "Approved" },
  { key: "recently_rejected", label: "Rejected" },
  { key: "my_drafts", label: "Drafts" },
];

export function ApprovalCentre() {
  const [view, setView] = useState<ApprovalCentreView>("awaiting_me");
  const [kind, setKind] = useState<ApprovalItemKind | "">("");
  const [courseId, setCourseId] = useState("");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<ApprovalCentreCounts | null>(null);
  const [result, setResult] = useState<PaginatedResult<ApprovalCentreRow> | null>(null);
  const [pending, startTransition] = useTransition();

  function load(next: { view?: ApprovalCentreView; page?: number; kind?: ApprovalItemKind | ""; courseId?: string } = {}) {
    const nextView = next.view ?? view;
    const nextPage = next.page ?? page;
    const nextKind = next.kind ?? kind;
    const nextCourseId = next.courseId ?? courseId;
    startTransition(async () => {
      try {
        const [rows, badgeCounts] = await Promise.all([
          listApprovalCentre({
            view: nextView,
            kind: nextKind,
            course_id: nextCourseId.trim(),
            page: nextPage,
            page_size: 20,
          }),
          getApprovalCentreCounts(),
        ]);
        setResult(rows);
        setCounts(badgeCounts);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load Approval Centre.");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial list load
  }, []);

  function changeView(nextView: ApprovalCentreView) {
    setView(nextView);
    setPage(1);
    load({ view: nextView, page: 1 });
  }

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load({ page: 1 });
  }

  const rows = result?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Approval Centre</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Course revisions and essay marks that need review, publication, or follow-up.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-900 self-start">
        {views.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => changeView(item.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${
              view === item.key
                ? "bg-white text-[#2D6A4F] shadow-sm dark:bg-gray-800 dark:text-[#52b788]"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {item.label}
            {item.countKey && counts && counts[item.countKey] > 0 && (
              <span className="rounded-full bg-[#2D6A4F]/10 px-2 py-0.5 text-xs font-bold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
                {counts[item.countKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      <DashboardCard className="p-4">
        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Type
            <select value={kind} onChange={(e) => setKind(e.target.value as ApprovalItemKind | "")} className="input">
              <option value="">All work</option>
              <option value="COURSE_REVISION">Course revisions</option>
              <option value="ESSAY_MARK">Essay marks</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Course ID
            <input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Optional" className="input" />
          </label>
          <button className="h-10 rounded-xl bg-[#2D6A4F] px-4 text-sm font-bold text-white">Apply</button>
        </form>
      </DashboardCard>

      <DashboardCard>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
            {pending ? "Loading approval items..." : "No items found for this view."}
          </p>
        ) : (
          <div className={`overflow-x-auto ${pending ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Submitted by</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {rows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td className="px-4 py-3">
                      <ItemLink kind={row.kind} id={row.id}>{row.item_title}</ItemLink>
                      <div className="mt-1 text-xs text-gray-500">{row.course_title ?? row.course_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={row.kind === "ESSAY_MARK" ? "amber" : "blue"}>{humanize(row.kind)}</Badge>
                        {row.risk && <Badge tone={riskTone(row.risk)}>{humanize(row.risk)} risk</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.submitted_by?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{humanize(row.current_stage ?? row.status)}</div>
                      <div className="text-xs text-gray-500">{humanize(row.status)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.reviewer?.name ?? "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className={row.is_overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}>
                        {formatDate(row.due_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {(row.available_actions ?? []).map(humanize).join(", ") || row.decision || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result && result.meta.total_pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={result.meta.total_pages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              load({ page: nextPage });
            }}
          />
        )}
      </DashboardCard>
    </div>
  );
}
