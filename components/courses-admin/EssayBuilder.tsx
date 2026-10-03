"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { gradeEssaySubmission, listEssaySubmissions, updateAssessmentSettings } from "@/lib/api/courses-client";
import type { CourseItem, EssaySubmission } from "@/lib/api/courses.types";
import { IconChevronDown, IconSpinner } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { TextAreaField } from "./FormControls";
import { FinalAssessmentBadge, FinalAssessmentToggle } from "./FinalAssessmentControls";
import { DatePicker, isoToLocalInput } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";

export function EssayBuilder({
  item,
  dispatch,
  onRequestRefresh,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRequestRefresh?: () => void;
}) {
  const essay = item.assessment?.essay;

  const [question, setQuestion] = useState(essay?.question ?? "");
  const [description, setDescription] = useState(essay?.description ?? "");
  const [submissionMode, setSubmissionMode] = useState<"TEXT" | "DOCUMENT">(essay?.submission_mode ?? "TEXT");
  const [dueDate, setDueDate] = useState<string>(isoToLocalInput(item.assessment?.due_date));
  const [passMark, setPassMark] = useState(String(essay?.pass_mark_percentage ?? 70));
  const [maxAttempts, setMaxAttempts] = useState(essay?.max_attempts ? String(essay.max_attempts) : "");
  const [requiresModeration, setRequiresModeration] = useState(essay?.requires_moderation ?? item.assessment?.is_final_assessment ?? false);
  const [isFinalAssessment, setIsFinalAssessment] = useState(item.assessment?.is_final_assessment ?? false);

  const [saving, setSaving] = useState(false);

  if (!essay) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_final_assessment: isFinalAssessment,
        essay_settings: {
          question: question.trim(),
          description: description.trim(),
          submission_mode: submissionMode,
          pass_mark_percentage: parseInt(passMark) || 70,
          max_attempts: maxAttempts ? parseInt(maxAttempts) : null,
          requires_moderation: requiresModeration,
        },
      };
      await updateAssessmentSettings(item.id, payload);
      dispatch({
        type: "UPDATE_ASSESSMENT",
        itemId: item.id,
        assessment: {
          ...item.assessment!,
          due_date: payload.due_date,
          is_final_assessment: payload.is_final_assessment,
          essay: { ...essay, ...payload.essay_settings },
        },
      });
      toast.success("Essay settings saved.");
      onRequestRefresh?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save essay settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {item.assessment?.is_final_assessment && (
          <div>
            <FinalAssessmentBadge />
          </div>
        )}

        <TextAreaField
          label="Essay Prompt / Question"
          id={`essay-prompt-${item.id}`}
          value={question}
          onChange={setQuestion}
          required
          placeholder="e.g. Describe a trauma-informed intervention..."
        />
        
        <TextAreaField
          label="Instructions / Description"
          id={`essay-description-${item.id}`}
          value={description}
          onChange={setDescription}
          required
          placeholder="e.g. Write 500-800 words referencing at least one framework."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Submission Mode</label>
            <Select
              value={submissionMode}
              onChange={(value) => setSubmissionMode(value as "TEXT" | "DOCUMENT")}
            >
              <option value="TEXT">Text Field</option>
              <option value="DOCUMENT">File Upload (PDF, Word, etc.)</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`essay-due-${item.id}`} className="text-sm font-bold text-slate-700 dark:text-slate-300">Due Date (Optional)</label>
            <DatePicker
              id={`essay-due-${item.id}`}
              mode="datetime"
              title="Essay due date"
              presets="future"
              defaultTime={{ hours: 23, minutes: 55 }}
              value={dueDate}
              onChange={setDueDate}
              placeholder="No due date"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 dark:border-ink-line p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
            Pass mark and attempts only matter once this essay is a final assessment (below) — a
            regular essay has nothing that &ldquo;fails&rdquo; it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pass Mark (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={passMark}
                onChange={(e) => setPassMark(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Attempts (Optional)</label>
              <input
                type="number"
                min="1"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="Unlimited"
                className="rounded-xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
              />
            </div>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <FinalAssessmentToggle checked={isFinalAssessment} onChange={setIsFinalAssessment} />
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={requiresModeration}
              onChange={(e) => setRequiresModeration(e.target.checked)}
              className="mt-1 accent-brand-600"
            />
            <span>
              <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Requires moderation</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                When governance is enabled, marks flow through Marker, Moderator, and Approver before learners see results.
              </span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || !question.trim() || !description.trim()}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving && <IconSpinner className="text-white/80" />}
          Save Essay Details
        </button>
      </form>

      <EssaySubmissionsPanel itemId={item.id} />
    </div>
  );
}

function EssaySubmissionsPanel({ itemId }: { itemId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  async function loadPage(nextPage: number) {
    setLoading(true);
    try {
      const res = await listEssaySubmissions(itemId, { page: nextPage, page_size: 20 });
      setSubmissions((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setPage(nextPage);
      setHasNext(res.meta.has_next);
      setLoaded(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
      loadPage(1);
    }
  }

  function handleGraded(userId: string, updated: Partial<EssaySubmission>) {
    setSubmissions((prev) => prev.map((s) => (s.user_id === userId ? { ...s, ...updated } : s)));
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-ink-line">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
      >
        Submissions
        <span
          className="text-slate-400 transition-transform duration-150"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        >
          <IconChevronDown />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-ink-line p-4 flex flex-col gap-3">
          {loading && submissions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading submissions...</p>
          )}
          {!loading && loaded && submissions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No submissions yet.</p>
          )}
          {submissions.map((submission) => (
            <EssaySubmissionRow
              key={submission.user_id}
              itemId={itemId}
              submission={submission}
              onGraded={(updated) => handleGraded(submission.user_id, updated)}
            />
          ))}
          {hasNext && (
            <button
              type="button"
              onClick={() => loadPage(page + 1)}
              disabled={loading}
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer disabled:opacity-60"
            >
              {loading && <IconSpinner className="text-current" />}
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EssaySubmissionRow({
  itemId,
  submission,
  onGraded,
}: {
  itemId: string;
  submission: EssaySubmission;
  onGraded: (updated: Partial<EssaySubmission>) => void;
}) {
  const [score, setScore] = useState(submission.score !== null ? String(submission.score) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [isPublished, setIsPublished] = useState(submission.is_published);
  const [recommendation, setRecommendation] = useState<"PASS" | "FAIL">("PASS");
  const [submitForModeration, setSubmitForModeration] = useState(false);
  const [grading, setGrading] = useState(false);

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    const parsedScore = parseFloat(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      toast.error("Score must be between 0 and 100.");
      return;
    }
    setGrading(true);
    try {
      const mark = await gradeEssaySubmission(itemId, submission.user_id, {
        score: parsedScore,
        feedback: feedback.trim() || null,
        is_published: isPublished,
        recommendation,
        submit_for_moderation: submitForModeration,
      });
      const currentMarkId =
        mark && typeof mark === "object" && "id" in mark ? String((mark as { id: unknown }).id) : submission.current_mark_id;
      onGraded({
        score: parsedScore,
        feedback: feedback.trim() || null,
        is_published: isPublished,
        working_score: parsedScore,
        current_mark_id: currentMarkId,
        result_status: submitForModeration ? "AWAITING_MODERATION" : submission.result_status ?? "DRAFT_MARK",
      });
      toast.success("Essay graded.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to grade essay.");
    } finally {
      setGrading(false);
    }
  }

  return (
    <form
      onSubmit={handleGrade}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-ink-line p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{submission.user_full_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{submission.user_email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {submission.result_status && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                {submission.result_status.replaceAll("_", " ")}
              </span>
            )}
            {submission.working_score !== undefined && submission.working_score !== null && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Working score {submission.working_score}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          Submitted {new Date(submission.submitted_at).toLocaleString()}
        </p>
      </div>

      {submission.content_text ? (
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 max-h-48 overflow-y-auto">
          {submission.content_text}
        </p>
      ) : submission.document_download_url ? (
        <a
          href={submission.document_download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          Download {submission.document_file_name ?? "submission"}
        </a>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-start">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Score (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Feedback (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-2 py-1.5 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="accent-brand-600"
            />
            Publish to student
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={submitForModeration}
              onChange={(e) => setSubmitForModeration(e.target.checked)}
              className="accent-brand-600"
            />
            Submit for moderation
          </label>
          <Select
            size="sm"
            className="w-44"
            value={recommendation}
            onChange={(value) => setRecommendation(value as "PASS" | "FAIL")}
          >
            <option value="PASS">Recommend pass</option>
            <option value="FAIL">Recommend fail</option>
          </Select>
          {submission.current_mark_id && (
            <a
              href={`/dashboard/approval-centre/marks/${submission.current_mark_id}`}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Open mark workflow
            </a>
          )}
        </div>
        <button
          type="submit"
          disabled={grading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-70 cursor-pointer"
        >
          {grading && <IconSpinner className="text-white/80" />}
          {submission.score !== null ? "Update grade" : "Grade"}
        </button>
      </div>
    </form>
  );
}
