"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createQuizQuestion, generateQuizFromDocument } from "@/lib/api/courses-client";
import type {
  CourseQuizQuestion,
  CreateQuizQuestionPayload,
  GenerateQuizFromDocumentResult,
  GeneratedQuizQuestion,
} from "@/lib/api/courses.types";
import { IconPlus, IconSparkles, IconSpinner, IconUpload } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isAcceptedAssessmentFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_FILE_TYPES.includes(file.type) || name.endsWith(".pdf") || name.endsWith(".docx");
}

function toQuestionPayload(question: GeneratedQuizQuestion, orderIndex: number): CreateQuizQuestionPayload {
  return {
    text: question.text,
    order_index: orderIndex,
    allow_multiple_answers: question.allow_multiple_answers,
    multi_answer_mode: question.allow_multiple_answers ? question.multi_answer_mode ?? "OR" : null,
    options: question.options.map((option, index) => ({
      text: option.text,
      is_correct: option.is_correct,
      order_index: option.order_index ?? index,
    })),
  };
}

export function QuizAiAutocomplete({
  itemId,
  currentQuestionCount,
  dispatch,
}: {
  itemId: string;
  currentQuestionCount: number;
  dispatch: React.Dispatch<CourseEditorAction>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState("10");
  const [optionsPerQuestion, setOptionsPerQuestion] = useState("4");
  const [persist, setPersist] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingPreview, setAddingPreview] = useState(false);
  const [result, setResult] = useState<GenerateQuizFromDocumentResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      toast.error("Choose a PDF or DOCX file.");
      return;
    }

    if (!isAcceptedAssessmentFile(file)) {
      toast.error("Use a PDF or DOCX file.");
      return;
    }

    const parsedQuestionCount = Number(questionCount);
    const parsedOptionsPerQuestion = Number(optionsPerQuestion);

    if (!Number.isInteger(parsedQuestionCount) || parsedQuestionCount < 1 || parsedQuestionCount > 50) {
      toast.error("Question count must be between 1 and 50.");
      return;
    }

    if (!Number.isInteger(parsedOptionsPerQuestion) || parsedOptionsPerQuestion < 2 || parsedOptionsPerQuestion > 6) {
      toast.error("Options per question must be between 2 and 6.");
      return;
    }

    setGenerating(true);
    try {
      const nextResult = await generateQuizFromDocument(itemId, {
        file,
        question_count: parsedQuestionCount,
        options_per_question: parsedOptionsPerQuestion,
        persist,
      });

      setResult(nextResult);

      if (nextResult.persisted) {
        const createdQuestions = nextResult.created_questions ?? [];
        createdQuestions.forEach((question) => {
          dispatch({ type: "ADD_QUIZ_QUESTION", itemId, question });
        });
        toast.success(`Generated ${createdQuestions.length} question${createdQuestions.length === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Generated ${nextResult.generated_questions.length} preview question${nextResult.generated_questions.length === 1 ? "" : "s"}.`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to generate quiz questions.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddPreviewQuestions() {
    if (!result?.generated_questions.length) return;

    setAddingPreview(true);
    let createdCount = 0;

    try {
      for (const generatedQuestion of result.generated_questions) {
        const question: CourseQuizQuestion = await createQuizQuestion(
          itemId,
          toQuestionPayload(generatedQuestion, currentQuestionCount + createdCount),
        );
        dispatch({ type: "ADD_QUIZ_QUESTION", itemId, question });
        createdCount += 1;
      }
      setResult((prev) => (prev ? { ...prev, persisted: true } : prev));
      toast.success(`Added ${createdCount} generated question${createdCount === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add generated questions.");
    } finally {
      setAddingPreview(false);
    }
  }

  const generatedQuestions = result?.generated_questions ?? [];
  const canAddPreview = result && !result.persisted && generatedQuestions.length > 0;

  return (
    <section className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              AI Autocomplete
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <IconUpload />
              <span className="truncate">{file ? file.name : "PDF or DOCX"}</span>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setResult(null);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-64">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Questions
              <input
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(event) => setQuestionCount(event.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Options
              <input
                type="number"
                min="2"
                max="6"
                value={optionsPerQuestion}
                onChange={(event) => setOptionsPerQuestion(event.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={persist}
              onChange={(event) => {
                setPersist(event.target.checked);
                setResult(null);
              }}
              className="accent-[#2D6A4F]"
            />
            Save directly
          </label>

          <button
            type="submit"
            disabled={generating}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1e4d38] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {generating ? <IconSpinner className="text-white/80" /> : <IconSparkles />}
            Generate
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{result.source_file_name}</span>
            <span>{result.model}</span>
            <span>{generatedQuestions.length} generated</span>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="grid gap-2">
              {generatedQuestions.slice(0, 3).map((question, index) => (
                <div
                  key={`${question.text}-${index}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 p-3"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{question.text}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {question.options.length} options
                  </p>
                </div>
              ))}
              {generatedQuestions.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{generatedQuestions.length - 3} more
                </p>
              )}
            </div>
          )}

          {canAddPreview && (
            <button
              type="button"
              onClick={handleAddPreviewQuestions}
              disabled={addingPreview}
              className="self-start inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F]/10 px-3.5 py-2 text-xs font-semibold text-[#2D6A4F] transition-colors hover:bg-[#2D6A4F]/20 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#52b788]/15 dark:text-[#52b788] dark:hover:bg-[#52b788]/25"
            >
              {addingPreview ? <IconSpinner /> : <IconPlus />}
              Add generated questions
            </button>
          )}
        </div>
      )}
    </section>
  );
}
