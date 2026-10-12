"use client";

import Link from "next/link";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listAuditLog } from "@/lib/api/governance-client";
import type { AuditLogEntry } from "@/lib/api/governance.types";
import { Pagination } from "@/components/generic/ui/Pagination";
import { Avatar, Badge, DashboardCard, formatDate, humanize, Segmented, SkeletonRows } from "./GovernanceUtils";
import { CourseSearchSelect, type SelectedCourse } from "./SearchSelects";

const PAGE_SIZE = 25;

type EntityFilter = "" | "COURSE_REVISION" | "COURSE_VERSION" | "STAFF_ROLE" | "ESSAY_MARK";

function actionTone(action: string): "gray" | "green" | "amber" | "red" | "blue" {
  if (action.includes("REJECT") || action.includes("ARCHIVE") || action.includes("REVOKE")) return "red";
  if (action.includes("RETURN") || action.includes("WITHDRAW") || action.includes("DISCARD")) return "amber";
  if (action.includes("APPROV") || action.includes("PUBLISH") || action.includes("GRANT")) return "green";
  if (action.includes("SUBMIT") || action.includes("CLAIM") || action.includes("ASSIGN")) return "blue";
  return "gray";
}

function actionLabel(action: string): string {
  return humanize(action.replace(/^DECISION_/, ""));
}

function itemHref(entry: AuditLogEntry): string | null {
  if (entry.revision_id) return `/dashboard/approval-centre/revisions/${entry.revision_id}`;
  if (entry.entity_type === "ESSAY_MARK") return `/dashboard/approval-centre/marks/${entry.entity_id}`;
  return null;
}

/** The governance audit log: who did what, to which item, when, and why. */
export function AuditTrail() {
  const [entity, setEntity] = useState<EntityFilter>("");
  const [course, setCourse] = useState<SelectedCourse | null>(null);
  const [page, setPage] = useState(1);

  const params = { entity_type: entity || undefined, course_id: course?.id, page, page_size: PAGE_SIZE };
  const list = useQuery({
    queryKey: ["governance-audit", params],
    queryFn: () => listAuditLog(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const rows = list.data?.items ?? [];
  const forbidden = list.error instanceof ApiError && list.error.status === 403;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/approval-centre"
          className="text-sm font-semibold text-slate-500 no-underline hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
        >
          ← Back to Approval Centre
        </Link>
        <h1 className="font-display mt-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Audit trail</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every review decision, submission, publication and role change, newest first.
        </p>
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-ink-line lg:flex-row lg:items-center">
          <Segmented<EntityFilter>
            value={entity}
            onChange={(next) => {
              setEntity(next);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              { value: "COURSE_REVISION", label: "Reviews" },
              { value: "COURSE_VERSION", label: "Versions" },
              { value: "STAFF_ROLE", label: "Roles" },
              { value: "ESSAY_MARK", label: "Marks" },
            ]}
          />
          <div className="lg:ml-auto lg:w-64">
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

        {list.isLoading ? (
          <SkeletonRows rows={8} />
        ) : forbidden ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            You don&apos;t have permission to view the audit trail.
          </p>
        ) : list.isError ? (
          <p className="px-6 py-16 text-center text-sm text-red-600 dark:text-red-400">
            {list.error instanceof ApiError ? list.error.message : "Failed to load the audit trail."}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">No audit entries match these filters.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-ink-line">
            {rows.map((entry) => {
              const href = itemHref(entry);
              return (
                <li key={entry.id} className="flex gap-3 px-5 py-4">
                  <Avatar name={entry.actor?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {entry.actor?.name ?? (entry.actor_id ? "Unknown user" : "System")}
                      </span>
                      <Badge tone={actionTone(entry.action)}>{actionLabel(entry.action)}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{humanize(entry.entity_type)}</span>
                      {entry.version_label && <span className="text-xs text-slate-400">v{entry.version_label}</span>}
                    </div>
                    {entry.course_title && (
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {href ? (
                          <Link href={href} className="font-semibold text-brand-600 no-underline hover:underline dark:text-brand-400">
                            {entry.course_title}
                          </Link>
                        ) : (
                          entry.course_title
                        )}
                      </p>
                    )}
                    {entry.comment && (
                      <p className="mt-2 whitespace-pre-wrap border-l-2 border-slate-200 pl-3 text-sm text-slate-600 dark:border-ink-line dark:text-slate-300">
                        {entry.comment}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(entry.occurred_at)}
                      {entry.from_status || entry.to_status
                        ? ` · ${entry.from_status ? humanize(entry.from_status) : "-"} → ${entry.to_status ? humanize(entry.to_status) : "-"}`
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {list.data && list.data.meta.total_pages > 1 && (
          <div className="border-t border-slate-200 p-4 dark:border-ink-line">
            <Pagination currentPage={page} totalPages={list.data.meta.total_pages} onPageChange={setPage} />
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
