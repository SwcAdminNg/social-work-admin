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
import { Avatar, Badge, DashboardCard, formatDate, humanize, riskTone } from "./GovernanceUtils";
import { UserSearchSelect, type SelectedUser } from "./SearchSelects";
import { DatePicker, formatValue } from "@/components/ui/date-picker";

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
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<SelectedUser | null>(null);
  const [assignDueAt, setAssignDueAt] = useState("");

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

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignUser) {
      toast.error("Select a reviewer first.");
      return;
    }
    const due_at = assignDueAt ? new Date(assignDueAt).toISOString() : undefined;
    await runAction("ASSIGN_REVIEWER", () => assignRevision(revisionId, assignUser.id, due_at), "Reviewer assigned.");
    setAssignOpen(false);
    setAssignUser(null);
    setAssignDueAt("");
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
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading revision...</p>;
  }

  if (!revision) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Revision unavailable.</p>;
  }

  const risk = revision.effective_risk ?? revision.risk ?? revision.risk_level;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard/approval-centre" className="text-sm font-semibold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 no-underline">
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
            <h1 className="font-display mt-3 text-xl font-extrabold text-slate-900 dark:text-white">{revision.course_title ?? revision.course_id}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Current stage: <span className="font-semibold text-slate-700 dark:text-slate-300">{humanize(revision.current_stage)}</span>
            </p>
            {revision.change_summary && <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{revision.change_summary}</p>}
            {revision.blocked_reason && <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-300">{revision.blocked_reason}</p>}
          </div>
          <ActionBar
            actions={actions}
            acting={acting}
            onSubmit={handleSubmitRevision}
            onWithdraw={() => runAction("WITHDRAW", () => withdrawRevision(revisionId), "Revision withdrawn.")}
            onDiscard={() => runAction("DISCARD", () => discardRevision(revisionId), "Revision discarded.")}
            onClaim={() => runAction("CLAIM", () => claimRevision(revisionId), "Revision claimed.")}
            onAssign={() => setAssignOpen((value) => !value)}
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

      {assignOpen && actions.has("ASSIGN_REVIEWER") && (
        <DashboardCard className="p-5">
          <form onSubmit={handleAssign} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Reviewer
              <UserSearchSelect value={assignUser} onChange={setAssignUser} placeholder="Search reviewers by name or email" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Due date
              <DatePicker
                mode="datetime"
                title="Review due date"
                presets="future"
                defaultTime={{ hours: 17, minutes: 0 }}
                min={formatValue(new Date(), "datetime")}
                value={assignDueAt}
                onChange={setAssignDueAt}
                aria-label="Review due date"
                placeholder="No due date"
              />
            </label>
            <button
              type="submit"
              disabled={!assignUser || acting === "ASSIGN_REVIEWER"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              {acting === "ASSIGN_REVIEWER" && <IconSpinner />}
              Assign reviewer
            </button>
          </form>
        </DashboardCard>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-ink-surface self-start">
        {(["diff", "timeline", "preview", "comments", "evidence"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              if (key === "preview") ensurePreview();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === key ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {humanize(key)}
          </button>
        ))}
      </div>

      {tab === "diff" && (
        <DashboardCard className="divide-y divide-slate-200 dark:divide-ink-line">
          {diff.length === 0 ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No diff data available.</p>
          ) : (
            diff.map((change, index) => (
              <div key={`${change.key ?? change.label}-${index}`} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={change.op === "REMOVED" ? "red" : change.op === "ADDED" ? "green" : "amber"}>{humanize(change.op)}</Badge>
                  {change.risk && <Badge tone={riskTone(change.risk)}>{humanize(change.risk)}</Badge>}
                  <span className="text-xs font-semibold uppercase text-slate-400">{humanize(change.entity)}</span>
                </div>
                <h3 className="font-display mt-2 text-sm font-bold text-slate-900 dark:text-white">{change.label}</h3>
                {change.fields && <p className="mt-1 text-xs text-slate-500">Fields: {change.fields.join(", ")}</p>}
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <JsonBox title="Before" value={change.before} />
                  <JsonBox title="After" value={change.after} />
                </div>
              </div>
            ))
          )}
        </DashboardCard>
      )}

      {tab === "timeline" && <AuditTimeline revision={revision} />}

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
            <button disabled={acting === "COMMENT"} className="self-start rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              Add comment
            </button>
          </form>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-slate-200 p-3 dark:border-ink-line">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{comment.author?.name ?? "Reviewer"}</div>
                <div className="text-xs text-slate-500">{formatDate(comment.created_at)}</div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{comment.body}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          </div>
        </DashboardCard>
      )}

      {tab === "evidence" && (
        <DashboardCard className="p-5">
          <form onSubmit={addEvidence} className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
              <input value={evidenceLink.title} onChange={(e) => setEvidenceLink({ ...evidenceLink, title: e.target.value })} className="input mt-1" />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              URL
              <input type="url" value={evidenceLink.url} onChange={(e) => setEvidenceLink({ ...evidenceLink, url: e.target.value })} className="input mt-1" />
            </label>
            <button disabled={acting === "ATTACH_EVIDENCE"} className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white disabled:opacity-60">
              Attach
            </button>
          </form>
          <div className="space-y-3">
            {evidence.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-ink-line">
                <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                <a href={item.download_url ?? item.url ?? "#"} target="_blank" rel="noreferrer" className="text-sm text-brand-600 dark:text-brand-400">
                  {item.file_name ?? item.url ?? "Open evidence"}
                </a>
              </div>
            ))}
            {evidence.length === 0 && <p className="text-sm text-slate-500">No evidence attached.</p>}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}

const decisionTone: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
  APPROVED: "green",
  APPROVED_WITH_MINOR_CHANGES: "green",
  FORCE_APPROVED: "blue",
  RETURNED_FOR_REVISION: "amber",
  ESCALATED: "blue",
  REJECTED: "red",
};

function conditionText(condition: unknown): string {
  if (typeof condition === "string") return condition;
  if (condition && typeof condition === "object" && "text" in condition) return String((condition as { text?: unknown }).text ?? "");
  return "";
}

/**
 * The revision's audit trail: every reviewer decision with who, when, why and the status it
 * moved to, followed by the per-round stage ledger (who held each stage and who decided it).
 */
function AuditTimeline({ revision }: { revision: GovernanceRevision }) {
  const decisions = [...(revision.decisions ?? [])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const stages = [...(revision.stages ?? [])].sort(
    (a, b) => (b.round ?? 0) - (a.round ?? 0) || (a.sequence ?? 0) - (b.sequence ?? 0),
  );
  const submittedBy = revision.submitted_by ?? revision.author;

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <DashboardCard className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Decision history</h2>
        {decisions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No decisions yet.
            {revision.submitted_at && ` Submitted ${formatDate(revision.submitted_at)}${submittedBy?.name ? ` by ${submittedBy.name}` : ""}.`}
          </p>
        ) : (
          <ol className="mt-4 space-y-5">
            {decisions.map((decision) => {
              const conditions = (decision.conditions ?? []).map(conditionText).filter(Boolean);
              return (
                <li key={decision.id} className="flex gap-3">
                  <Avatar name={decision.actor?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{decision.actor?.name ?? "Unknown reviewer"}</span>
                      <Badge tone={decisionTone[decision.decision] ?? "gray"}>{humanize(decision.decision)}</Badge>
                      {decision.stage && <span className="text-xs text-slate-500 dark:text-slate-400">{humanize(decision.stage)}</span>}
                      {decision.round ? <span className="text-xs text-slate-400">Round {decision.round}</span> : null}
                    </div>
                    {decision.comment && (
                      <p className="mt-2 whitespace-pre-wrap border-l-2 border-slate-200 pl-3 text-sm text-slate-700 dark:border-ink-line dark:text-slate-300">
                        {decision.comment}
                      </p>
                    )}
                    {conditions.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700 dark:text-amber-300">
                        {conditions.map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(decision.created_at)}
                      {decision.from_status && decision.to_status
                        ? ` · ${humanize(decision.from_status)} → ${humanize(decision.to_status)}`
                        : decision.to_status
                          ? ` · ${humanize(decision.to_status)}`
                          : ""}
                      {decision.version_label ? ` · v${decision.version_label}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </DashboardCard>

      <DashboardCard className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Review stages</h2>
        <div className="mt-4 space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.id ?? `${stage.stage}-${stage.round ?? index}`} className="flex gap-3">
              <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-brand-600" />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {humanize(stage.stage)}
                  {stage.round ? <span className="ml-2 text-xs font-medium text-slate-400">Round {stage.round}</span> : null}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {humanize(stage.status)} · reviewer {stage.assigned_reviewer?.name ?? stage.decided_by?.name ?? "unassigned"}
                  {stage.decided_at ? ` · decided ${formatDate(stage.decided_at)}` : stage.due_at ? ` · due ${formatDate(stage.due_at)}` : ""}
                </div>
              </div>
            </div>
          ))}
          {stages.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No stages yet.</p>}
        </div>
      </DashboardCard>
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
              ? "bg-brand-600 text-white"
              : button.tone === "danger"
                ? "bg-red-600 text-white"
                : "border border-slate-200 text-slate-700 dark:border-ink-line dark:text-slate-200"
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
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-ink-line dark:bg-ink-page ${large ? "min-h-96" : ""}`}>
      <div className="mb-2 text-xs font-bold uppercase text-slate-500">{title}</div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">
        {value === undefined ? "-" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
