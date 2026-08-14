"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createQuizQuestion, updateAssessmentSettings } from "@/lib/api/courses-client";
import type { CourseItem, CreateQuizOptionPayload } from "@/lib/api/courses.types";
import { IconPlus, IconSpinner, IconTrash } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { QuizQuestionCard } from "./QuizQuestionCard";

function newDraftOption(): CreateQuizOptionPayload & { key: string } {
  return { key: Math.random().toString(36).slice(2), text: "", is_correct: false, order_index: 0 };
}

export function QuizBuilder({
  item,
  dispatch,
}: {
  item: CourseItem;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [multiAnswerMode, setMultiAnswerMode] = useState<"AND" | "OR">("OR");
  const [draftOptions, setDraftOptions] = useState([newDraftOption(), newDraftOption()]);
  const [submitting, setSubmitting] = useState(false);

  const [editingSettings, setEditingSettings] = useState(false);
  const [dueDate, setDueDate] = useState<string>(item.assessment?.due_date ? item.assessment.due_date.slice(0, 16) : "");
  const [passMark, setPassMark] = useState(String(item.assessment?.quiz?.pass_mark_percentage ?? 70));
  const [maxAttempts, setMaxAttempts] = useState(item.assessment?.quiz?.max_attempts ? String(item.assessment.quiz.max_attempts) : "");
  const [showResult, setShowResult] = useState(item.assessment?.quiz?.show_result_to_student ?? true);
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
        assessment: { ...item.assessment!, due_date: payload.due_date, quiz: { ...quiz, ...payload.quiz_settings } },
      });
      setEditingSettings(false);
      toast.success("Quiz settings updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {editingSettings ? (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/20">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Quiz Settings</h4>
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
            <div className="flex items-center gap-2 mt-4">
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
          <div className="flex items-center gap-4">
            <span>Pass mark: {quiz.pass_mark_percentage}%</span>
            <span>Attempts: {quiz.max_attempts ? quiz.max_attempts : "Unlimited"}</span>
            {item.assessment?.due_date && <span>Due: {new Date(item.assessment.due_date).toLocaleDateString()}</span>}
          </div>
          <button type="button" onClick={() => setEditingSettings(true)} className="font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline cursor-pointer">Edit settings</button>
        </div>
      )}

      {quiz.questions.map((question) => (
        <QuizQuestionCard key={question.id} question={question} dispatch={dispatch} />
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
                  name="draft-correct"
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
  );
}
