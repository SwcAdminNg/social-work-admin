"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  addQuizOption,
  deleteQuizOption,
  deleteQuizQuestion,
  updateQuizOption,
  updateQuizQuestion,
} from "@/lib/api/courses-client";
import type { CourseQuizQuestion } from "@/lib/api/courses.types";
import { IconPlus, IconTrash } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";
import { ConfirmDialog } from "./ConfirmDialog";

export function QuizQuestionCard({
  question,
  dispatch,
}: {
  question: CourseQuizQuestion;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const [text, setText] = useState(question.text);
  const [newOptionText, setNewOptionText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveText() {
    const trimmed = text.trim();
    if (!trimmed || trimmed === question.text) {
      setText(question.text);
      return;
    }
    try {
      await updateQuizQuestion(question.id, { text: trimmed });
      dispatch({ type: "UPDATE_QUIZ_QUESTION", questionId: question.id, fields: { text: trimmed } });
    } catch (error) {
      setText(question.text);
      toast.error(error instanceof ApiError ? error.message : "Failed to update question.");
    }
  }

  async function toggleAllowMultiple() {
    const next = !question.allow_multiple_answers;
    try {
      await updateQuizQuestion(question.id, { allow_multiple_answers: next });
      dispatch({ type: "UPDATE_QUIZ_QUESTION", questionId: question.id, fields: { allow_multiple_answers: next } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update question.");
    }
  }

  async function toggleOptionCorrect(optionId: string, checked: boolean) {
    try {
      if (!question.allow_multiple_answers && checked) {
        const others = question.options.filter((o) => o.id !== optionId && o.is_correct);
        await Promise.all(others.map((o) => updateQuizOption(o.id, { is_correct: false })));
        others.forEach((o) =>
          dispatch({ type: "UPDATE_QUIZ_OPTION", optionId: o.id, fields: { is_correct: false } })
        );
      }
      await updateQuizOption(optionId, { is_correct: checked });
      dispatch({ type: "UPDATE_QUIZ_OPTION", optionId, fields: { is_correct: checked } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update option.");
    }
  }

  async function saveOptionText(optionId: string, value: string, original: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === original) return;
    try {
      await updateQuizOption(optionId, { text: trimmed });
      dispatch({ type: "UPDATE_QUIZ_OPTION", optionId, fields: { text: trimmed } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update option.");
    }
  }

  async function handleAddOption() {
    const trimmed = newOptionText.trim();
    if (!trimmed) return;
    try {
      const option = await addQuizOption(question.id, {
        text: trimmed,
        is_correct: false,
        order_index: question.options.length,
      });
      dispatch({ type: "ADD_QUIZ_OPTION", questionId: question.id, option });
      setNewOptionText("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add option.");
    }
  }

  async function handleRemoveOption(optionId: string) {
    try {
      await deleteQuizOption(optionId);
      dispatch({ type: "REMOVE_QUIZ_OPTION", optionId });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to remove option.");
    }
  }

  async function handleDeleteQuestion() {
    setDeleting(true);
    try {
      await deleteQuizQuestion(question.id);
      dispatch({ type: "REMOVE_QUIZ_QUESTION", questionId: question.id });
      toast.success("Question deleted.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete question.");
      setDeleting(false);
    }
  }

  const hasCorrectOption = question.options.some((o) => o.is_correct);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-start gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveText}
          className="flex-1 bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1.5 py-1"
        />
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
          aria-label="Delete question"
        >
          <IconTrash />
        </button>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked={question.allow_multiple_answers}
          onChange={toggleAllowMultiple}
          className="accent-[#2D6A4F]"
        />
        Allow multiple correct answers
      </label>

      {!hasCorrectOption && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-1.5">
          Mark at least one option as correct.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <OptionRow
            key={option.id}
            optionId={option.id}
            text={option.text}
            isCorrect={option.is_correct ?? false}
            allowMultiple={question.allow_multiple_answers}
            onToggleCorrect={(checked) => toggleOptionCorrect(option.id, checked)}
            onSaveText={(value) => saveOptionText(option.id, value, option.text)}
            onRemove={() => handleRemoveOption(option.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddOption();
            }
          }}
          placeholder="New option text"
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 transition-colors duration-150 cursor-pointer"
        >
          <IconPlus />
          Add
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this question?"
        description="All of its options will be removed too."
        loading={deleting}
        onConfirm={handleDeleteQuestion}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function OptionRow({
  text: initialText,
  isCorrect,
  allowMultiple,
  onToggleCorrect,
  onSaveText,
  onRemove,
}: {
  optionId: string;
  text: string;
  isCorrect: boolean;
  allowMultiple: boolean;
  onToggleCorrect: (checked: boolean) => void;
  onSaveText: (value: string) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState(initialText);

  return (
    <div className="flex items-center gap-2">
      <input
        type={allowMultiple ? "checkbox" : "radio"}
        checked={isCorrect}
        onChange={(e) => onToggleCorrect(e.target.checked)}
        className="accent-[#2D6A4F]"
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSaveText(text)}
        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 cursor-pointer"
        aria-label="Remove option"
      >
        <IconTrash />
      </button>
    </div>
  );
}
