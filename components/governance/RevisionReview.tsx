"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  addRevisionComment,
  addRevisionEvidenceLink,
  assignRevision,
  claimRevision,
  decideRevision,
  discardRevision,
  forceApproveRevision,
  getRevision,
  getRevisionComments,
  getRevisionDiff,
  getRevisionEvidence,
  getRevisionPreview,
  getRevisionTree,
  overrideRevisionRisk,
  publishRevision,
  submitRevision,
  withdrawRevision,
} from "@/lib/api/governance-client";
import type {
  DecisionValue,
  GovernanceRevision,
  RevisionAction,
  RevisionComment,
  RevisionDiffChange,
  RevisionEvidence,
  RiskLevel,
} from "@/lib/api/governance.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { Badge, DashboardCard, formatDate, humanize, riskTone } from "./GovernanceUtils";

type Tab = "diff" | "timeline" | "preview" | "comments" | "evidence";

export function RevisionReview({ revisionId }: { revisionId: string }) {
  const [revision, setRevision] = useState<GovernanceRevision | null>(null);
  const [diff, setDiff] = useState<RevisionDiffChange[]>([]);
  const [tree, setTree] = useState<unknown>(null);
  const [preview, setPreview] = useState<unknown>(null);
  const [comments, setComments] = useState<RevisionComment[]>([]);
  const [evidence, setEvidence] = useState<RevisionEvidence[]>([]);
  const [tab, setTab] = useState<Tab>("diff");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [evidenceLink, setEvidenceLink] = useState({ title: "", url: "" });

  async function load() {
    setLoading(true);
    try {
      const [detail, changes, commentsResult, evidenceResult] = await Promise.all([
        getRevision(revisionId),
        getRevisionDiff(revisionId).catch(() => []),
        getRevisionComments(revisionId).catch(() => []),
        getRevisionEvidence(revisionId).catch(() => []),
      ]);
      setRevision(detail);
      setDiff(changes);
      setComments(commentsResult);
      setEvidence(evidenceResult);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load revision.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revision detail initial load
  }, [revisionId]);

  async function ensurePreview() {
    if (preview !== null && tree !== null) return;
    try {
      const [previewData, treeData] = await Promise.all([
        getRevisionPreview(revisionId).catch((error) => ({ error: error instanceof Error ? error.message : "Preview unavailable" })),
        getRevisionTree(revisionId).catch((error) => ({ error: error instanceof Error ? error.message : "Tree unavailable" })),
      ]);
      setPreview(previewData);
      setTree(treeData);
    } catch {
      // Individual calls already map to displayable fallbacks.
    }
  }

  async function runAction(name: string, fn: () => Promise<GovernanceRevision | unknown>, success: string) {
    setActing(name);
    try {
      const updated = await fn();
      if (updated && typeof updated === "object" && "id" in updated) {
        setRevision(updated as GovernanceRevision);
      } else {
        await load();
      }
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  async function handleDecision(decision: DecisionValue) {
    const comment =
      decision === "APPROVED"
        ? window.prompt("Optional comment") ?? undefined
        : window.prompt("Comment") ?? undefined;
    if (decision !== "APPROVED" && !comment?.trim()) return;
    const conditions =
      decision === "APPROVED_WITH_MINOR_CHANGES"
        ? window.prompt("Conditions, one per line")?.split("\n").map((c) => c.trim()).filter(Boolean)
        : undefined;
    const escalate_to =
      decision === "ESCALATED" ? (window.prompt("Escalate risk to LOW, MEDIUM, or HIGH", "HIGH") as RiskLevel | null) : undefined;
    await runAction(
      decision,
      () => decideRevision(revisionId, { decision, comment, conditions, escalate_to: escalate_to || undefined }),
      "Decision saved.",
    );
  }

  async function handleSubmitRevision() {
    const change_summary = window.prompt("Change summary");
    if (!change_summary?.trim()) return;
    const reason = window.prompt("Reason") ?? undefined;
    const declared_risk = window.prompt("Declared risk (LOW, MEDIUM, HIGH)", "LOW") as RiskLevel | null;
    await runAction(
      "SUBMIT",
      () => submitRevision(revisionId, { change_summary, reason, declared_risk: declared_risk || undefined }),
      "Revision submitted.",
    );
  }

  async function handleAssign() {
    const reviewerId = window.prompt("Reviewer user ID");
    if (!reviewerId?.trim()) return;
    const dueInput = window.prompt("Due date/time (optional, local datetime accepted)") ?? "";
    const due_at = dueInput.trim() ? new Date(dueInput).toISOString() : undefined;
    await runAction("ASSIGN_REVIEWER", () => assignRevision(revisionId, reviewerId, due_at), "Reviewer assigned.");
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setActing("COMMENT");
    try {
      const comment = await addRevisionComment(revisionId, commentBody.trim());
      setComments((prev) => [comment, ...prev]);
      setCommentBody("");
      toast.success("Comment added.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add comment.");
    } finally {
      setActing(null);
    }
  }

  async function addEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!evidenceLink.title.trim() || !evidenceLink.url.trim()) return;
    setActing("ATTACH_EVIDENCE");
    try {
      const item = await addRevisionEvidenceLink(revisionId, evidenceLink);
      setEvidence((prev) => [item, ...prev]);
      setEvidenceLink({ title: "", url: "" });
      toast.success("Evidence attached.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to attach evidence.");
    } finally {
      setActing(null);
    }
  }

  const actions = useMemo(() => new Set<RevisionAction>(revision?.available_actions ?? []), [revision]);

  if (loading && !revision) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading revision...</p>;
  }

  if (!revision) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Revision unavailable.</p>;
  }

  const risk = revision.risk ?? revision.risk_level;

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
              <Badge tone={riskTone(risk)}>{risk ? `${humanize(risk)} risk` : "Risk pending"}</Badge>
              <Badge tone="blue">{humanize(revision.status)}</Badge>
              {revision.proposed_version_label && <Badge tone="gray">v{revision.proposed_version_label}</Badge>}
            </div>
            <h1 className="mt-3 text-xl font-extrabold text-gray-900 dark:text-white">{revision.course_title ?? revision.course_id}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current stage: <span className="font-semibold text-gray-700 dark:text-gray-300">{humanize(revision.current_stage)}</span>
            </p>
            {revision.change_summary && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{revision.change_summary}</p>}
            {revision.blocked_reason && <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">{revision.blocked_reason}</p>}
          </div>
          <ActionBar
            actions={actions}
            acting={acting}
            onSubmit={handleSubmitRevision}
            onWithdraw={() => runAction("WITHDRAW", () => withdrawRevision(revisionId), "Revision withdrawn.")}
            onDiscard={() => runAction("DISCARD", () => discardRevision(revisionId), "Revision discarded.")}
            onClaim={() => runAction("CLAIM", () => claimRevision(revisionId), "Revision claimed.")}
            onAssign={handleAssign}
            onDecision={handleDecision}
            onForceApprove={() => {
              const justification = window.prompt("Justification (20+ characters)");
              if (justification) runAction("FORCE_APPROVE", () => forceApproveRevision(revisionId, justification), "Revision force-approved.");
            }}
            onOverrideRisk={() => {
              const level = window.prompt("New risk level (LOW, MEDIUM, HIGH)", "LOW") as RiskLevel | null;
              const reason = window.prompt("Reason");
              if (level && reason) runAction("OVERRIDE_RISK", () => overrideRevisionRisk(revisionId, level, reason), "Risk updated.");
            }}
            onPublish={() => runAction("PUBLISH", () => publishRevision(revisionId), "Revision published.")}
          />
        </div>
      </DashboardCard>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-900 self-start">
        {(["diff", "timeline", "preview", "comments", "evidence"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              if (key === "preview") ensurePreview();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === key ? "bg-white text-[#2D6A4F] shadow-sm dark:bg-gray-800 dark:text-[#52b788]" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {humanize(key)}
          </button>
        ))}
      </div>

      {tab === "diff" && (
        <DashboardCard className="divide-y divide-gray-200 dark:divide-gray-800">
          {diff.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 dark:text-gray-400">No diff data available.</p>
          ) : (
            diff.map((change, index) => (
              <div key={`${change.key ?? change.label}-${index}`} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={change.op === "REMOVED" ? "red" : change.op === "ADDED" ? "green" : "amber"}>{humanize(change.op)}</Badge>
                  {change.risk && <Badge tone={riskTone(change.risk)}>{humanize(change.risk)}</Badge>}
                  <span className="text-xs font-semibold uppercase text-gray-400">{humanize(change.entity)}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">{change.label}</h3>
                {change.fields && <p className="mt-1 text-xs text-gray-500">Fields: {change.fields.join(", ")}</p>}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <JsonBox title="Before" value={change.before} />
                  <JsonBox title="After" value={change.after} />
                </div>
              </div>
            ))
          )}
        </DashboardCard>
      )}

      {tab === "timeline" && (
        <DashboardCard className="p-5">
          <div className="space-y-4">
            {(revision.stages ?? []).map((stage, index) => (
              <div key={`${stage.stage}-${stage.round ?? index}`} className="flex gap-3">
                <div className="mt-1 h-3 w-3 rounded-full bg-[#2D6A4F]" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{humanize(stage.stage)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {humanize(stage.status)} · reviewer {stage.reviewer?.name ?? stage.assigned_to?.name ?? "unassigned"} · due {formatDate(stage.due_at)}
                  </div>
                  {stage.decision && <div className="text-sm text-gray-700 dark:text-gray-300">Decision: {humanize(stage.decision)}</div>}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {tab === "preview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <JsonBox title="Learner preview" value={preview} large />
          <JsonBox title="Editor tree" value={tree} large />
        </div>
      )}

      {tab === "comments" && (
        <DashboardCard className="p-5">
          <form onSubmit={addComment} className="mb-5 flex flex-col gap-3">
            <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} rows={3} className="input resize-none" placeholder="Add a review comment" />
            <button disabled={acting === "COMMENT"} className="self-start rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              Add comment
            </button>
          </form>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{comment.author?.name ?? "Reviewer"}</div>
                <div className="text-xs text-gray-500">{formatDate(comment.created_at)}</div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{comment.body}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
          </div>
        </DashboardCard>
      )}

      {tab === "evidence" && (
        <DashboardCard className="p-5">
          <form onSubmit={addEvidence} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Title
              <input value={evidenceLink.title} onChange={(e) => setEvidenceLink({ ...evidenceLink, title: e.target.value })} className="input mt-1" />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              URL
              <input type="url" value={evidenceLink.url} onChange={(e) => setEvidenceLink({ ...evidenceLink, url: e.target.value })} className="input mt-1" />
            </label>
            <button disabled={acting === "ATTACH_EVIDENCE"} className="h-10 rounded-xl bg-[#2D6A4F] px-4 text-sm font-bold text-white disabled:opacity-60">
              Attach
            </button>
          </form>
          <div className="space-y-3">
            {evidence.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                <a href={item.download_url ?? item.url ?? "#"} target="_blank" rel="noreferrer" className="text-sm text-[#2D6A4F] dark:text-[#52b788]">
                  {item.file_name ?? item.url ?? "Open evidence"}
                </a>
              </div>
            ))}
            {evidence.length === 0 && <p className="text-sm text-gray-500">No evidence attached.</p>}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}

function ActionBar({
  actions,
  acting,
  onSubmit,
  onWithdraw,
  onDiscard,
  onClaim,
  onAssign,
  onDecision,
  onForceApprove,
  onOverrideRisk,
  onPublish,
}: {
  actions: Set<RevisionAction>;
  acting: string | null;
  onSubmit: () => void;
  onWithdraw: () => void;
  onDiscard: () => void;
  onClaim: () => void;
  onAssign: () => void;
  onDecision: (decision: DecisionValue) => void;
  onForceApprove: () => void;
  onOverrideRisk: () => void;
  onPublish: () => void;
}) {
  const buttons: { action: RevisionAction; label: string; onClick: () => void; tone?: "primary" | "danger" }[] = [
    { action: "SUBMIT", label: "Submit", onClick: onSubmit, tone: "primary" },
    { action: "WITHDRAW", label: "Withdraw", onClick: onWithdraw },
    { action: "DISCARD", label: "Discard", onClick: onDiscard, tone: "danger" },
    { action: "CLAIM", label: "Claim", onClick: onClaim, tone: "primary" },
    { action: "ASSIGN_REVIEWER", label: "Assign", onClick: onAssign },
    { action: "APPROVE", label: "Approve", onClick: () => onDecision("APPROVED"), tone: "primary" },
    { action: "APPROVE_WITH_MINOR_CHANGES", label: "Minor changes", onClick: () => onDecision("APPROVED_WITH_MINOR_CHANGES") },
    { action: "RETURN_FOR_REVISION", label: "Return", onClick: () => onDecision("RETURNED_FOR_REVISION") },
    { action: "REJECT", label: "Reject", onClick: () => onDecision("REJECTED"), tone: "danger" },
    { action: "ESCALATE", label: "Escalate", onClick: () => onDecision("ESCALATED") },
    { action: "FORCE_APPROVE", label: "Force approve", onClick: onForceApprove },
    { action: "OVERRIDE_RISK", label: "Risk", onClick: onOverrideRisk },
    { action: "PUBLISH", label: "Publish", onClick: onPublish, tone: "primary" },
  ];
  const visible = buttons.filter((button) => actions.has(button.action));

  return (
    <div className="flex flex-wrap gap-2 lg:justify-end">
      {visible.map((button) => (
        <button
          key={button.action}
          type="button"
          onClick={button.onClick}
          disabled={!!acting}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60 ${
            button.tone === "primary"
              ? "bg-[#2D6A4F] text-white"
              : button.tone === "danger"
                ? "bg-red-600 text-white"
                : "border border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-200"
          }`}
        >
          {acting === button.action && <IconSpinner />}
          {button.label}
        </button>
      ))}
    </div>
  );
}

function JsonBox({ title, value, large = false }: { title: string; value: unknown; large?: boolean }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 ${large ? "min-h-96" : ""}`}>
      <div className="mb-2 text-xs font-bold uppercase text-gray-500">{title}</div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
        {value === undefined ? "-" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
