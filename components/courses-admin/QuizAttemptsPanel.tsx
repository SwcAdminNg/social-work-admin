"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listQuizAttempts } from "@/lib/api/courses-client";
import type { QuizAttemptReview, QuizAttemptReviewQuestion } from "@/lib/api/courses.types";
import { IconChevronDown, IconSearch, IconSparkles, IconSpinner } from "@/components/dashboard/icons";

/**
 * Learners' attempts at a quiz or quiz group. Retries are reworded by AI, so each
 * attempt is shown exactly as that learner saw it, with what they chose.
 */
export function QuizAttemptsPanel({ itemId }: { itemId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttemptReview[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [query, setQuery] = useState("");

  async function loadPage(nextPage: number) {
    setLoading(true);
    try {
      const res = await listQuizAttempts(itemId, { page: nextPage, page_size: 20 });
      setAttempts((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setPage(nextPage);
      setHasNext(res.meta.has_next);
      setLoaded(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load attempts.");
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) loadPage(1);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attempts;
    return attempts.filter(
      (a) => a.user_full_name.toLowerCase().includes(q) || a.user_email.toLowerCase().includes(q),
    );
  }, [attempts, query]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-ink-line">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer"
      >
        Learner Attempts
        <span
          className="text-slate-400 transition-transform duration-150"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        >
          <IconChevronDown />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-ink-line p-4 flex flex-col gap-3">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Retries are reworded by AI so they can&apos;t be passed from memory. Each attempt shows the wording that
            learner saw, what they chose and the correct answers.
          </p>

          {attempts.length > 0 && (
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search learners on this page"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand-500 dark:border-ink-line dark:bg-ink-surface dark:text-white"
              />
            </label>
          )}

          {loading && attempts.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading attempts...</p>
          )}
          {!loading && loaded && attempts.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No attempts yet.</p>
          )}
          {loaded && attempts.length > 0 && shown.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No learner on this page matches.</p>
          )}

          {shown.map((attempt) => (
            <AttemptRow key={attempt.attempt_id} attempt={attempt} />
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

function AttemptRow({ attempt }: { attempt: QuizAttemptReview }) {
  const [open, setOpen] = useState(false);
  const inProgress = attempt.status === "IN_PROGRESS";
  const when = attempt.submitted_at ?? attempt.started_at;

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-3 text-left cursor-pointer"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
            {attempt.user_full_name}
          </span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {attempt.user_email} · Attempt {attempt.attempt_number}
            {when ? ` · ${formatDateTime(when)}` : ""}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {attempt.paraphrased && (
            <Chip tone="violet">
              <IconSparkles />
              Reworded by AI
            </Chip>
          )}
          {attempt.is_reset && <Chip tone="slate">Cleared by reset</Chip>}
          {attempt.auto_submitted && <Chip tone="amber">Time ran out</Chip>}
          {inProgress ? (
            <Chip tone="sky">In progress</Chip>
          ) : (
            <Chip tone={attempt.passed ? "green" : "red"}>
              {typeof attempt.score === "number" ? `${Math.round(attempt.score)}%` : "—"} ·{" "}
              {attempt.passed ? "Passed" : "Not passed"}
            </Chip>
          )}
          <span
            className="text-slate-400 transition-transform duration-150"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          >
            <IconChevronDown />
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-ink-line px-3.5 py-3 flex flex-col gap-3">
          {!attempt.version_recorded && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This attempt was made before quiz versions were saved, so today&apos;s wording is shown.
            </p>
          )}
          {attempt.questions.map((question, idx) => (
            <QuestionReview key={question.id} index={idx} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionReview({ index, question }: { index: number; question: QuizAttemptReviewQuestion }) {
  const reworded = question.text !== question.original_text;
  const nothingChosen = !question.options.some((o) => o.selected);
  const verdict = question.earned >= 1 ? "Correct" : question.earned > 0 ? "Partly correct" : "Incorrect";
  const verdictClass =
    question.earned >= 1
      ? "text-emerald-700 dark:text-emerald-300"
      : question.earned > 0
        ? "text-amber-700 dark:text-amber-300"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:bg-ink-surface dark:ring-ink-line">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Question {index + 1}
          {question.section_title ? ` · ${question.section_title}` : ""}
        </p>
        <p className={`text-xs font-semibold ${verdictClass}`}>
          {nothingChosen ? "Not answered" : verdict}
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{question.text}</p>
      {reworded && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Original:</span> {question.original_text}
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-1.5">
        {question.options.map((option) => {
          const tone = option.is_correct
            ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/25"
            : option.selected
              ? "bg-red-50 ring-red-200 dark:bg-red-500/10 dark:ring-red-400/25"
              : "bg-slate-50 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-ink-line";
          return (
            <li key={option.id} className={`rounded-lg px-3 py-2 ring-1 ${tone}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-slate-800 dark:text-slate-100">{option.text}</span>
                <span className="flex flex-none gap-1.5 text-[11px] font-semibold">
                  {option.selected && <span className="text-slate-700 dark:text-slate-200">Chosen</span>}
                  {option.is_correct && <span className="text-emerald-700 dark:text-emerald-300">Correct</span>}
                </span>
              </div>
              {option.text !== option.original_text && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Original: {option.original_text}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CHIP_TONES = {
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  slate: "bg-slate-200/70 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
} as const;

function Chip({ tone, children }: { tone: keyof typeof CHIP_TONES; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold [&_svg]:h-3 [&_svg]:w-3 ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
