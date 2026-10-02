"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  approveEssayMark,
  disputeEssayMark,
  getEssayMark,
  moderateEssayMark,
  publishEssayMarks,
  submitEssayMark,
} from "@/lib/api/governance-client";
import type { EssayMark, MarkAction } from "@/lib/api/governance.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { Badge, DashboardCard, formatDate, humanize } from "./GovernanceUtils";

export function EssayMarkReview({ markId }: { markId: string }) {
  const [mark, setMark] = useState<EssayMark | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setMark(await getEssayMark(markId));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load essay mark.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark detail initial load
  }, [markId]);

  async function run(action: string, fn: () => Promise<EssayMark | unknown>, success: string) {
    setActing(action);
    try {
      const result = await fn();
      if (result && typeof result === "object" && "status" in result) setMark(result as EssayMark);
      else await load();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  const actions = useMemo(() => new Set<MarkAction>(mark?.available_actions ?? []), [mark]);

  if (loading && !mark) return <p className="text-sm text-gray-500">Loading essay mark...</p>;
  if (!mark) return <p className="text-sm text-gray-500">Essay mark unavailable.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/approval-centre" className="text-sm font-semibold text-gray-500 hover:text-[#2D6A4F] dark:text-gray-400 dark:hover:text-[#52b788] no-underline">
          ← Back to Approval Centre
        </Link>
      </div>

      <DashboardCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="amber">{humanize(mark.status)}</Badge>
              {mark.recommendation && <Badge tone={mark.recommendation === "PASS" ? "green" : "red"}>{mark.recommendation}</Badge>}
            </div>
            <h1 className="mt-3 text-xl font-extrabold text-gray-900 dark:text-white">
              {mark.student?.name ?? mark.user_id ?? "Essay mark"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{mark.course_title ?? mark.course_id}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {actions.has("SUBMIT_FOR_MODERATION") && (
              <ActionButton acting={acting} action="SUBMIT_FOR_MODERATION" label="Submit" onClick={() => run("SUBMIT_FOR_MODERATION", () => submitEssayMark(markId), "Mark submitted for moderation.")} />
            )}
            {actions.has("MODERATE") && (
              <>
                <ActionButton acting={acting} action="MODERATE_APPROVE" label="Moderate approve" onClick={() => run("MODERATE_APPROVE", () => moderateEssayMark(markId, { action: "APPROVE" }), "Mark moderated.")} />
                <ActionButton acting={acting} action="MODERATE_AMEND" label="Amend" onClick={() => {
                  const score = Number(window.prompt("Moderated score"));
                  const note = window.prompt("Note");
                  const feedback = window.prompt("Feedback") ?? undefined;
                  if (!Number.isNaN(score) && note) run("MODERATE_AMEND", () => moderateEssayMark(markId, { action: "AMEND", score, note, feedback }), "Mark amended.");
                }} />
                <ActionButton acting={acting} action="MODERATE_RETURN" label="Return" danger onClick={() => {
                  const note = window.prompt("Return note");
                  if (note) run("MODERATE_RETURN", () => moderateEssayMark(markId, { action: "RETURN", note }), "Mark returned.");
                }} />
              </>
            )}
            {actions.has("DISPUTE") && (
              <ActionButton acting={acting} action="DISPUTE" label="Dispute" onClick={() => {
                const note = window.prompt("Dispute note");
                if (note) run("DISPUTE", () => disputeEssayMark(markId, note), "Dispute submitted.");
              }} />
            )}
            {actions.has("APPROVE") && (
              <ActionButton acting={acting} action="APPROVE" label="Approve" onClick={() => {
                const scoreInput = window.prompt("Final score (optional)");
                const final_score = scoreInput?.trim() ? Number(scoreInput) : undefined;
                const final_feedback = window.prompt("Final feedback") ?? undefined;
                const note = window.prompt("Note") ?? undefined;
                const publish = window.confirm("Publish after approval?");
                run("APPROVE", () => approveEssayMark(markId, { final_score, final_feedback, note, publish }), "Mark approved.");
              }} />
            )}
            {actions.has("PUBLISH") && mark.item_id && (
              <ActionButton acting={acting} action="PUBLISH" label="Publish" onClick={() => run("PUBLISH", () => publishEssayMarks(mark.item_id as string, { mark_ids: [markId] }), "Mark published.")} />
            )}
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Marker" person={mark.marker?.name} score={mark.score} feedback={mark.feedback} />
        <InfoCard title="Moderator" person={mark.moderator?.name} score={mark.moderated_score} feedback={mark.moderated_feedback} />
        <InfoCard title="Approver" person={mark.approver?.name} score={mark.final_score} feedback={mark.final_feedback} />
      </div>

      <DashboardCard className="p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">History</h2>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-950 dark:text-gray-300">
          {JSON.stringify(mark.history ?? [], null, 2)}
        </pre>
        <p className="mt-3 text-xs text-gray-500">Last updated {formatDate(mark.updated_at)}</p>
      </DashboardCard>
    </div>
  );
}

function ActionButton({
  action,
  label,
  acting,
  onClick,
  danger,
}: {
  action: string;
  label: string;
  acting: string | null;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!acting}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60 ${
        danger ? "bg-red-600 text-white" : "bg-[#2D6A4F] text-white"
      }`}
    >
      {acting === action && <IconSpinner />}
      {label}
    </button>
  );
}

function InfoCard({
  title,
  person,
  score,
  feedback,
}: {
  title: string;
  person?: string | null;
  score?: number | null;
  feedback?: string | null;
}) {
  return (
    <DashboardCard className="p-5">
      <div className="text-xs font-bold uppercase text-gray-500">{title}</div>
      <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{person ?? "Unassigned"}</div>
      <div className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">{score ?? "-"}</div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{feedback || "No feedback recorded."}</p>
    </DashboardCard>
  );
}
