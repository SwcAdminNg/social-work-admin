"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createQuizQuestion, updateAssessmentSettings } from "@/lib/api/courses-client";
import type { CourseItem, CreateQuizOptionPayload } from "@/lib/api/courses.types";
import { IconPlus, IconSpinner, IconTrash } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { FinalAssessmentBadge, FinalAssessmentToggle } from "./FinalAssessmentControls";
import { QuizAiAutocomplete } from "./QuizAiAutocomplete";
import { DatePicker, isoToLocalInput } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";

function newDraftOption(): CreateQuizOptionPayload & { key: string } {
  return { key: Math.random().toString(36).slice(2), text: "", is_correct: false, order_index: 0 };
}

export function QuizBuilder({
  item,
  dispatch,
  onRequestRefresh,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRequestRefresh?: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [multiAnswerMode, setMultiAnswerMode] = useState<"AND" | "OR">("OR");
  const [draftOptions, setDraftOptions] = useState([newDraftOption(), newDraftOption()]);
  const [submitting, setSubmitting] = useState(false);

  const [editingSettings, setEditingSettings] = useState(false);
  const [dueDate, setDueDate] = useState<string>(isoToLocalInput(item.assessment?.due_date));
  const [passMark, setPassMark] = useState(String(item.assessment?.quiz?.pass_mark_percentage ?? 70));
  const [maxAttempts, setMaxAttempts] = useState(item.assessment?.quiz?.max_attempts ? String(item.assessment.quiz.max_attempts) : "");
  const [showResult, setShowResult] = useState(item.assessment?.quiz?.show_result_to_student ?? true);
  const [isFinalAssessment, setIsFinalAssessment] = useState(item.assessment?.is_final_assessment ?? false);
  const [savingSettings, setSavingSettings] = useState(false);

  const quiz = item.assessment?.quiz;
  if (!quiz) return null;

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
      const question = await createQuizQuestion(item.id, {
        text: draftText,
        order_index: quiz.questions.length,
        allow_multiple_answers: allowMultiple,
        multi_answer_mode: allowMultiple ? multiAnswerMode : null,
        options: filledOptions.map((o, index) => ({
          text: o.text.trim(),
          is_correct: o.is_correct,
          order_index: index,
        })),
      });
      dispatch({ type: "ADD_QUIZ_QUESTION", itemId: item.id, question });
      onRequestRefresh?.();
      resetDraft();
      toast.success("Question added.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_final_assessment: isFinalAssessment,
        quiz_settings: {
          pass_mark_percentage: parseInt(passMark) || 70,
          max_attempts: maxAttempts ? parseInt(maxAttempts) : null,
          show_result_to_student: showResult,
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
          quiz: { ...quiz, ...payload.quiz_settings },
        },
      });
      setEditingSettings(false);
      toast.success("Quiz settings updated.");
      onRequestRefresh?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {editingSettings ? (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-ink-line p-4 bg-slate-50/50 dark:bg-slate-800/20">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Quiz Settings</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`quiz-due-${item.id}`} className="text-xs font-medium text-slate-700 dark:text-slate-300">Due Date (Optional)</label>
              <DatePicker
                id={`quiz-due-${item.id}`}
                mode="datetime"
                size="sm"
                title="Quiz due date"
                presets="future"
                defaultTime={{ hours: 23, minutes: 55 }}
                value={dueDate}
                onChange={setDueDate}
                placeholder="No due date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pass Mark (%)</label>
              <input type="number" min="0" max="100" value={passMark} onChange={(e) => setPassMark(e.target.value)} required className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Max Attempts (Optional)</label>
              <input type="number" min="1" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} placeholder="Unlimited" className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={showResult} onChange={(e) => setShowResult(e.target.checked)} className="accent-brand-600" />
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Show result to student</label>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 sm:col-span-2" />
            <FinalAssessmentToggle checked={isFinalAssessment} onChange={setIsFinalAssessment} />
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={() => setEditingSettings(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" disabled={savingSettings} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-70">
              {savingSettings && <IconSpinner className="text-white/80" />} Save Settings
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Pass mark: {quiz.pass_mark_percentage}%</span>
            <span>Attempts: {quiz.max_attempts ? quiz.max_attempts : "Unlimited"}</span>
            {item.assessment?.due_date && <span>Due: {new Date(item.assessment.due_date).toLocaleDateString()}</span>}
            {item.assessment?.is_final_assessment && <FinalAssessmentBadge />}
          </div>
          <button type="button" onClick={() => setEditingSettings(true)} className="font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer">Edit settings</button>
        </div>
      )}

      <QuizAiAutocomplete itemId={item.id} currentQuestionCount={quiz.questions.length} dispatch={dispatch} />

      {quiz.questions.map((question) => (
        <QuizQuestionCard key={question.id} question={question} dispatch={dispatch} />
      ))}

      {adding ? (
        <form
          onSubmit={handleAddQuestion}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-ink-line p-4"
        >
          <input
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            required
            placeholder="Question text"
            className="rounded-xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="accent-brand-600"
              />
              Allow multiple correct answers
            </label>
            {allowMultiple && (
              <Select
                size="sm"
                className="w-56"
                value={multiAnswerMode}
                onChange={(value) => setMultiAnswerMode(value as "AND" | "OR")}
              >
                <option value="OR">Partial Credit (OR)</option>
                <option value="AND">All-or-Nothing (AND)</option>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {draftOptions.map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <input
                  type={allowMultiple ? "checkbox" : "radio"}
                  name="draft-correct"
                  checked={option.is_correct}
                  onChange={(e) => updateDraftOption(option.key, { is_correct: e.target.checked })}
                  className="accent-brand-600"
                />
                <input
                  value={option.text}
                  onChange={(e) => updateDraftOption(option.key, { text: e.target.value })}
                  placeholder="Option text"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setDraftOptions((prev) => prev.filter((o) => o.key !== option.key))}
                  disabled={draftOptions.length <= 2}
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                  aria-label="Remove option"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setDraftOptions((prev) => [...prev, newDraftOption()])}
              className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
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
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 cursor-pointer disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-600/10 dark:bg-brand-400/15 hover:bg-brand-600/20 dark:hover:bg-brand-400/25 transition-colors duration-150 cursor-pointer"
        >
          <IconPlus />
          Add question
        </button>
      )}
    </div>
  );
}
