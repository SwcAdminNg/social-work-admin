"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { gradeEssaySubmission, listEssaySubmissions, updateAssessmentSettings } from "@/lib/api/courses-client";
import type { CourseItem, EssaySubmission } from "@/lib/api/courses.types";
import { IconChevronDown, IconSpinner } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { TextAreaField } from "./FormControls";

export function EssayBuilder({
  item,
  dispatch,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const essay = item.assessment?.essay;

  const [question, setQuestion] = useState(essay?.question ?? "");
  const [description, setDescription] = useState(essay?.description ?? "");
  const [submissionMode, setSubmissionMode] = useState<"TEXT" | "DOCUMENT">(essay?.submission_mode ?? "TEXT");
  const [dueDate, setDueDate] = useState<string>(item.assessment?.due_date ? item.assessment.due_date.slice(0, 16) : "");

  const [saving, setSaving] = useState(false);

  if (!essay) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        essay_settings: {
          question: question.trim(),
          description: description.trim(),
          submission_mode: submissionMode,
        },
      };
      await updateAssessmentSettings(item.id, payload);
      dispatch({
        type: "UPDATE_ASSESSMENT",
        itemId: item.id,
        assessment: { ...item.assessment!, due_date: payload.due_date, essay: { ...essay, ...payload.essay_settings } },
      });
      toast.success("Essay settings saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save essay settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
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
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Submission Mode</label>
            <select
              value={submissionMode}
              onChange={(e) => setSubmissionMode(e.target.value as "TEXT" | "DOCUMENT")}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            >
              <option value="TEXT">Text Field</option>
              <option value="DOCUMENT">File Upload (PDF, Word, etc.)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Due Date (Optional)</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !question.trim() || !description.trim()}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer"
      >
        Submissions
        <span
          className="text-gray-400 transition-transform duration-150"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        >
          <IconChevronDown />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3">
          {loading && submissions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading submissions...</p>
          )}
          {!loading && loaded && submissions.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No submissions yet.</p>
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
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline cursor-pointer disabled:opacity-60"
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
      await gradeEssaySubmission(itemId, submission.user_id, {
        score: parsedScore,
        feedback: feedback.trim() || null,
        is_published: isPublished,
      });
      onGraded({ score: parsedScore, feedback: feedback.trim() || null, is_published: isPublished });
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
      className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{submission.user_full_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{submission.user_email}</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          Submitted {new Date(submission.submitted_at).toLocaleString()}
        </p>
      </div>

      {submission.content_text ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-gray-800/40 p-3 max-h-48 overflow-y-auto">
          {submission.content_text}
        </p>
      ) : submission.document_download_url ? (
        <a
          href={submission.document_download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline"
        >
          Download {submission.document_file_name ?? "submission"}
        </a>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-start">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Score (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Feedback (Optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="accent-[#2D6A4F]"
          />
          Publish to student
        </label>
        <button
          type="submit"
          disabled={grading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors disabled:opacity-70 cursor-pointer"
        >
          {grading && <IconSpinner className="text-white/80" />}
          {submission.score !== null ? "Update grade" : "Grade"}
        </button>
      </div>
    </form>
  );
}
