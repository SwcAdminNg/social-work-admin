"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  createQuizGroupSection,
  createQuizGroupSectionQuestion,
  deleteQuizGroupSection,
  updateAssessmentSettings,
  updateQuizGroupSection,
} from "@/lib/api/courses-client";
import type {
  CourseItem,
  CourseQuizGroupSection,
  CourseQuizQuestion,
  CreateQuizOptionPayload,
} from "@/lib/api/courses.types";
import { IconAlertTriangle, IconChevronDown, IconPlus, IconSpinner, IconTrash } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { ConfirmDialog } from "./ConfirmDialog";

function newDraftOption(): CreateQuizOptionPayload & { key: string } {
  return { key: Math.random().toString(36).slice(2), text: "", is_correct: false, order_index: 0 };
}

export function QuizGroupBuilder({
  item,
  dispatch,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const quizGroup = item.assessment?.quiz_group;

  const [editingSettings, setEditingSettings] = useState(false);
  const [dueDate, setDueDate] = useState<string>(item.assessment?.due_date ? item.assessment.due_date.slice(0, 16) : "");
  const [passMark, setPassMark] = useState(String(quizGroup?.pass_mark_percentage ?? 70));
  const [maxAttempts, setMaxAttempts] = useState(quizGroup?.max_attempts ? String(quizGroup.max_attempts) : "");
  const [showResult, setShowResult] = useState(quizGroup?.show_result_to_student ?? true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    quizGroup?.time_limit_seconds ? String(Math.round(quizGroup.time_limit_seconds / 60)) : ""
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [addingSection, setAddingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionQuestionsToAsk, setSectionQuestionsToAsk] = useState("");
  const [addingSectionSubmitting, setAddingSectionSubmitting] = useState(false);

  if (!quizGroup) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const parsedMinutes = timeLimitMinutes ? parseInt(timeLimitMinutes, 10) : null;
      const payload = {
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        quiz_group_settings: {
          pass_mark_percentage: parseInt(passMark) || 70,
          max_attempts: maxAttempts ? parseInt(maxAttempts) : null,
          show_result_to_student: showResult,
          time_limit_seconds: parsedMinutes && parsedMinutes > 0 ? parsedMinutes * 60 : null,
        },
      };
      await updateAssessmentSettings(item.id, payload);
      dispatch({ type: "UPDATE_QUIZ_GROUP_SETTINGS", itemId: item.id, fields: payload.quiz_group_settings });
      dispatch({
        type: "UPDATE_ASSESSMENT",
        itemId: item.id,
        assessment: { ...item.assessment!, due_date: payload.due_date, quiz_group: { ...quizGroup, ...payload.quiz_group_settings } },
      });
      setEditingSettings(false);
      toast.success("Quiz group settings updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSectionSubmitting(true);
    try {
      const parsed = sectionQuestionsToAsk ? parseInt(sectionQuestionsToAsk, 10) : null;
      const section = await createQuizGroupSection(item.id, {
        title: sectionTitle.trim(),
        order_index: quizGroup.sections.length,
        questions_to_ask: parsed && parsed > 0 ? parsed : null,
      });
      dispatch({ type: "ADD_QUIZ_GROUP_SECTION", itemId: item.id, section });
      setSectionTitle("");
      setSectionQuestionsToAsk("");
      setAddingSection(false);
      toast.success("Section added.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add section.");
    } finally {
      setAddingSectionSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {editingSettings ? (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/20">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quiz Group Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Due Date (Optional)</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Pass Mark (%)</label>
              <input type="number" min="0" max="100" value={passMark} onChange={(e) => setPassMark(e.target.value)} required className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Max Attempts (Optional)</label>
              <input type="number" min="1" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} placeholder="Unlimited" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Time Limit, Minutes (Optional)</label>
              <input type="number" min="1" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} placeholder="Untimed" className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={showResult} onChange={(e) => setShowResult(e.target.checked)} className="accent-[#2D6A4F]" />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Show result to student</label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={() => setEditingSettings(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" disabled={savingSettings} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors disabled:opacity-70">
              {savingSettings && <IconSpinner className="text-white/80" />} Save Settings
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Pass mark: {quizGroup.pass_mark_percentage}%</span>
            <span>Attempts: {quizGroup.max_attempts ? quizGroup.max_attempts : "Unlimited"}</span>
            <span>Time limit: {quizGroup.time_limit_seconds ? `${Math.round(quizGroup.time_limit_seconds / 60)} min` : "Untimed"}</span>
            {item.assessment?.due_date && <span>Due: {new Date(item.assessment.due_date).toLocaleDateString()}</span>}
          </div>
          <button type="button" onClick={() => setEditingSettings(true)} className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline cursor-pointer">Edit settings</button>
        </div>
      )}

      {quizGroup.sections.map((section) => (
        <QuizGroupSectionPanel
          key={section.id}
          section={section}
          maxAttempts={quizGroup.max_attempts}
          dispatch={dispatch}
        />
      ))}

      {addingSection ? (
        <form onSubmit={handleAddSection} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              required
              placeholder="Section title, e.g. Safety Principles"
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
            <input
              type="number"
              min="1"
              value={sectionQuestionsToAsk}
              onChange={(e) => setSectionQuestionsToAsk(e.target.value)}
              placeholder="Questions to ask (blank = all)"
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={() => {
                setAddingSection(false);
                setSectionTitle("");
                setSectionQuestionsToAsk("");
              }}
              disabled={addingSectionSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingSectionSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {addingSectionSubmitting && <IconSpinner className="text-white/80" />}
              Add section
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingSection(true)}
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 cursor-pointer"
        >
          <IconPlus />
          Add section
        </button>
      )}
    </div>
  );
}

function QuizGroupSectionPanel({
  section,
  maxAttempts,
  dispatch,
}: {
  section: CourseQuizGroupSection;
  maxAttempts: number | null;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [title, setTitle] = useState(section.title);
  const [questionsToAsk, setQuestionsToAsk] = useState(section.questions_to_ask ? String(section.questions_to_ask) : "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [multiAnswerMode, setMultiAnswerMode] = useState<"AND" | "OR">("OR");
  const [draftOptions, setDraftOptions] = useState([newDraftOption(), newDraftOption()]);
  const [submitting, setSubmitting] = useState(false);

  async function saveTitle() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === section.title) {
      setTitle(section.title);
      return;
    }
    try {
      await updateQuizGroupSection(section.id, { title: trimmed });
      dispatch({ type: "UPDATE_QUIZ_GROUP_SECTION", sectionId: section.id, fields: { title: trimmed } });
    } catch (error) {
      setTitle(section.title);
      toast.error(error instanceof ApiError ? error.message : "Failed to rename section.");
    }
  }

  async function saveQuestionsToAsk() {
    const trimmed = questionsToAsk.trim();
    const parsed = parseInt(trimmed, 10);
    const newVal = !isNaN(parsed) && parsed > 0 ? parsed : null;
    if (newVal === section.questions_to_ask) {
      setQuestionsToAsk(section.questions_to_ask ? String(section.questions_to_ask) : "");
      return;
    }
    try {
      await updateQuizGroupSection(section.id, { questions_to_ask: newVal });
      dispatch({ type: "UPDATE_QUIZ_GROUP_SECTION", sectionId: section.id, fields: { questions_to_ask: newVal } });
      setQuestionsToAsk(newVal ? String(newVal) : "");
    } catch (error) {
      setQuestionsToAsk(section.questions_to_ask ? String(section.questions_to_ask) : "");
      toast.error(error instanceof ApiError ? error.message : "Failed to update section.");
    }
  }

  async function handleDeleteSection() {
    setDeleting(true);
    try {
      await deleteQuizGroupSection(section.id);
      dispatch({ type: "REMOVE_QUIZ_GROUP_SECTION", sectionId: section.id });
      toast.success("Section deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete section.");
      setDeleting(false);
    }
  }

  async function handleDuplicateQuestion(source: CourseQuizQuestion) {
    setDuplicatingId(source.id);
    try {
      const question = await createQuizGroupSectionQuestion(section.id, {
        text: `${source.text} (variant)`,
        order_index: section.questions.length,
        allow_multiple_answers: source.allow_multiple_answers,
        multi_answer_mode: source.allow_multiple_answers ? source.multi_answer_mode ?? "OR" : null,
        options: source.options.map((o, index) => ({
          text: o.text,
          is_correct: o.is_correct ?? false,
          order_index: index,
        })),
      });
      dispatch({ type: "ADD_QUIZ_GROUP_SECTION_QUESTION", sectionId: section.id, question });
      toast.success("Question duplicated — edit the copy to make it a distinct variant.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to duplicate question.");
    } finally {
      setDuplicatingId(null);
    }
  }

  const resetDraft = () => {
    setAdding(false);
    setDraftText("");
    setAllowMultiple(false);
    setMultiAnswerMode("OR");
    setDraftOptions([newDraftOption(), newDraftOption()]);
  };

  const updateDraftOption = (key: string, fields: Partial<CreateQuizOptionPayload>) => {
    setDraftOptions((prev) =>
      prev.map((o) => {
        if (o.key !== key) {
          return allowMultiple || fields.is_correct !== true ? o : { ...o, is_correct: false };
        }
        return { ...o, ...fields };
      })
    );
  };

  // How many attempts this pool can serve before a student is guaranteed to see a
  // repeated question. "Ask 3 of 3" means the pool IS the ask count — there's nothing
  // left over to rotate in, so every attempt is identical.
  const poolSize = section.questions.length;
  const askCount = section.questions_to_ask ?? poolSize;
  const noVariety = poolSize > 0 && askCount >= poolSize;
  const attemptsBeforeRepeat = askCount > 0 ? Math.floor(poolSize / askCount) : 0;
  const shortfall = maxAttempts != null && !noVariety && attemptsBeforeRepeat < maxAttempts
    ? maxAttempts * askCount - poolSize
    : 0;

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const filledOptions = draftOptions.filter((o) => o.text.trim());
    if (filledOptions.length < 2) {
      toast.error("Add at least two options.");
      return;
    }
    if (!filledOptions.some((o) => o.is_correct)) {
      toast.error("Mark at least one option as correct.");
      return;
    }

    setSubmitting(true);
    try {
      const question = await createQuizGroupSectionQuestion(section.id, {
        text: draftText,
        order_index: section.questions.length,
        allow_multiple_answers: allowMultiple,
        multi_answer_mode: allowMultiple ? multiAnswerMode : null,
        options: filledOptions.map((o, index) => ({
          text: o.text.trim(),
          is_correct: o.is_correct,
          order_index: index,
        })),
      });
      dispatch({ type: "ADD_QUIZ_GROUP_SECTION_QUESTION", sectionId: section.id, question });
      resetDraft();
      toast.success("Question added.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add question.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/30">
      <div className="flex items-center gap-2 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-0.5"
        />
        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
          <span>Ask</span>
          <input
            type="number"
            min="1"
            value={questionsToAsk}
            onChange={(e) => setQuestionsToAsk(e.target.value)}
            onBlur={saveQuestionsToAsk}
            placeholder="All"
            className="w-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
          <span>of {section.questions.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
          aria-label="Delete section"
        >
          <IconTrash />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-transform duration-150 cursor-pointer"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <IconChevronDown />
        </button>
      </div>

      {noVariety ? (
        <div className="flex items-start gap-2 px-3 pb-3 text-xs text-amber-700 dark:text-amber-400">
          <IconAlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Asking all {poolSize} question{poolSize === 1 ? "" : "s"} in the pool — every attempt will be
            identical. Add more questions (use the duplicate button on a question to spin off a variant) so
            retakes can draw something different.
          </span>
        </div>
      ) : shortfall > 0 ? (
        <div className="flex items-start gap-2 px-3 pb-3 text-xs text-amber-700 dark:text-amber-400">
          <IconAlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            This pool covers {attemptsBeforeRepeat} attempt{attemptsBeforeRepeat === 1 ? "" : "s"} without repeats,
            but Max Attempts is set to {maxAttempts}. Add {shortfall} more question{shortfall === 1 ? "" : "s"} to
            avoid repeats across every attempt.
          </span>
        </div>
      ) : maxAttempts != null && poolSize > 0 ? (
        <div className="px-3 pb-3 text-xs text-gray-400 dark:text-gray-600">
          Pool covers all {maxAttempts} attempt{maxAttempts === 1 ? "" : "s"} without repeats.
        </div>
      ) : null}

      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-3">
          {section.questions.map((question) => (
            <QuizQuestionCard
              key={question.id}
              question={question}
              dispatch={dispatch}
              onDuplicate={() => handleDuplicateQuestion(question)}
              duplicating={duplicatingId === question.id}
            />
          ))}

          {adding ? (
            <form
              onSubmit={handleAddQuestion}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <input
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                required
                placeholder="Question text"
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="accent-[#2D6A4F]"
                  />
                  Allow multiple correct answers
                </label>
                {allowMultiple && (
                  <select
                    value={multiAnswerMode}
                    onChange={(e) => setMultiAnswerMode(e.target.value as "AND" | "OR")}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="OR">Partial Credit (OR)</option>
                    <option value="AND">All-or-Nothing (AND)</option>
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {draftOptions.map((option) => (
                  <div key={option.key} className="flex items-center gap-2">
                    <input
                      type={allowMultiple ? "checkbox" : "radio"}
                      name={`draft-correct-${section.id}`}
                      checked={option.is_correct}
                      onChange={(e) => updateDraftOption(option.key, { is_correct: e.target.checked })}
                      className="accent-[#2D6A4F]"
                    />
                    <input
                      value={option.text}
                      onChange={(e) => updateDraftOption(option.key, { text: e.target.value })}
                      placeholder="Option text"
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftOptions((prev) => prev.filter((o) => o.key !== option.key))}
                      disabled={draftOptions.length <= 2}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                      aria-label="Remove option"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDraftOptions((prev) => [...prev, newDraftOption()])}
                  className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline cursor-pointer"
                >
                  <IconPlus />
                  Add option
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 mt-1">
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting && <IconSpinner className="text-white/80" />}
                  Add question
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 cursor-pointer"
            >
              <IconPlus />
              Add question
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this section?"
        description={`"${section.title}" and its question pool will be removed from the quiz group.`}
        loading={deleting}
        onConfirm={handleDeleteSection}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
