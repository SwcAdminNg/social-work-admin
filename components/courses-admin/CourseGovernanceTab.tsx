"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  getCourseGovernance,
  listCourseVersions,
  openCourseRevision,
  rollbackCourseVersion,
  submitRevision,
  withdrawRevision,
} from "@/lib/api/governance-client";
import type { CourseDetail } from "@/lib/api/courses.types";
import type { CourseVersion } from "@/lib/api/governance.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { Badge, DashboardCard, formatDate, humanize, riskTone } from "@/components/governance/GovernanceUtils";

export function CourseGovernanceTab({
  course,
  onRefresh,
}: {
  course: CourseDetail;
  onRefresh: () => void;
}) {
  const [versions, setVersions] = useState<CourseVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const governance = course.governance;
  const openRevision = governance?.open_revision;

  async function loadVersions(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      setVersions(await listCourseVersions(course.id));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load version history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    listCourseVersions(course.id)
      .then((items) => {
        if (!cancelled) setVersions(items);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof ApiError ? error.message : "Failed to load version history.");
      });
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  async function run(action: string, fn: () => Promise<unknown>, success: string) {
    setActing(action);
    try {
      await fn();
      toast.success(success);
      onRefresh();
      await loadVersions(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="flex flex-col gap-5">
        <DashboardCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={governance?.governance_enabled ? "green" : "gray"}>
                  Governance {governance?.governance_enabled ? "on" : "off"}
                </Badge>
                <Badge tone={course.governance_status === "ARCHIVED" ? "red" : "blue"}>
                  {humanize(course.governance_status ?? governance?.lifecycle)}
                </Badge>
                {(course.current_version_label ?? governance?.current_version_label) && (
                  <Badge tone="gray">v{course.current_version_label ?? governance?.current_version_label}</Badge>
                )}
              </div>
              <h3 className="mt-3 text-sm font-bold text-gray-900 dark:text-white">Course lifecycle</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Draft edits on published courses are held in a working copy until review and publish.
              </p>
            </div>
            <button
              type="button"
              disabled={!!acting}
              onClick={() => run("refresh", () => getCourseGovernance(course.id), "Governance refreshed.")}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Refresh
            </button>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Open revision</h3>
          {openRevision ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{humanize(openRevision.kind)}</Badge>
                <Badge tone="amber">{humanize(openRevision.status)}</Badge>
                {openRevision.is_editable !== undefined && (
                  <Badge tone={openRevision.is_editable ? "green" : "red"}>
                    {openRevision.is_editable ? "Editable" : "Locked"}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/approval-centre/revisions/${openRevision.id}`} className="rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-bold text-white no-underline">
                  Open review
                </Link>
                {openRevision.status === "DRAFT" && (
                  <button
                    type="button"
                    disabled={!!acting}
                    onClick={() => {
                      const change_summary = window.prompt("Change summary");
                      if (!change_summary) return;
                      const reason = window.prompt("Reason") ?? undefined;
                      run("submit", () => submitRevision(openRevision.id, { change_summary, reason }), "Revision submitted.");
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold dark:border-gray-800"
                  >
                    Submit for review
                  </button>
                )}
                {openRevision.status !== "DRAFT" && openRevision.status !== "PUBLISHED" && (
                  <button
                    type="button"
                    disabled={!!acting}
                    onClick={() => run("withdraw", () => withdrawRevision(openRevision.id), "Revision withdrawn.")}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold dark:border-gray-800"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">No open revision for this course.</p>
              <button
                type="button"
                disabled={!!acting}
                onClick={() => run("open", () => openCourseRevision(course.id), "Working copy opened.")}
                className="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold dark:border-gray-800"
              >
                Open working copy
              </button>
            </div>
          )}
        </DashboardCard>
      </div>

      <DashboardCard>
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Version history</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No versions recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {versions.map((version) => {
              const label = version.version_label ?? version.label ?? version.id;
              return (
                <div key={version.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">v{label}</span>
                        {version.is_current && <Badge tone="green">Current</Badge>}
                        {version.risk_level && <Badge tone={riskTone(version.risk_level)}>{humanize(version.risk_level)}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(version.published_at ?? version.approved_at)}</p>
                    </div>
                    {!version.is_current && version.has_snapshot && (
                      <button
                        type="button"
                        disabled={!!acting}
                        onClick={() => {
                          const reason = window.prompt(`Rollback to version ${label}? Reason`);
                          if (reason !== null) run(`rollback-${version.id}`, () => rollbackCourseVersion(course.id, version.id, reason), "Rollback revision created.");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold dark:border-gray-800"
                      >
                        {acting === `rollback-${version.id}` && <IconSpinner />}
                        Rollback
                      </button>
                    )}
                  </div>
                  {version.reason && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{version.reason}</p>}
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
