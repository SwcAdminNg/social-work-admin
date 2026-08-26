"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createQuizQuestion, generateQuizFromDocument, generateQuizFromPrompt } from "@/lib/api/courses-client";
import type {
  CourseQuizQuestion,
  CreateQuizQuestionPayload,
  GenerateQuizFromDocumentResult,
  GenerateQuizFromPromptResult,
  GeneratedQuizQuestion,
} from "@/lib/api/courses.types";
import { IconPlus, IconSparkles, IconSpinner, IconUpload } from "@/components/dashboard/icons";
import type { CourseEditorAction } from "./courseEditorReducer";

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type AiSourceMode = "FILE" | "PROMPT";

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
  const [sourceMode, setSourceMode] = useState<AiSourceMode>("FILE");
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<"GEMINI" | "OPENAI" | "DEEPSEEK">("GEMINI");
  const [model, setModel] = useState<string>("");
  const [questionCount, setQuestionCount] = useState("10");
  const [optionsPerQuestion, setOptionsPerQuestion] = useState("4");
  const [persist, setPersist] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [addingPreview, setAddingPreview] = useState(false);
  const [result, setResult] = useState<GenerateQuizFromDocumentResult | GenerateQuizFromPromptResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (sourceMode === "FILE" && !file) {
      toast.error("Choose a PDF or DOCX file.");
      return;
    }

    if (sourceMode === "FILE" && file && !isAcceptedAssessmentFile(file)) {
      toast.error("Use a PDF or DOCX file.");
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (sourceMode === "PROMPT" && trimmedPrompt.length < 10) {
      toast.error("Add a little more detail to the prompt.");
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
      let nextResult;
      if (sourceMode === "PROMPT") {
        nextResult = await generateQuizFromPrompt(itemId, {
          prompt: trimmedPrompt,
          question_count: parsedQuestionCount,
          options_per_question: parsedOptionsPerQuestion,
          persist,
          provider,
          model: model.trim() || undefined,
        });
      } else {
        nextResult = await generateQuizFromDocument(itemId, {
          file: file ?? undefined,
          question_count: parsedQuestionCount,
          options_per_question: parsedOptionsPerQuestion,
          persist,
          provider,
          model: model.trim() || undefined,
        });
      }

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
  const sourceLabel = 
    (result && "source_file_name" in result && result.source_file_name) 
      ? result.source_file_name 
      : (result && "source_prompt" in result && result.source_prompt) 
        ? result.source_prompt 
        : (sourceMode === "PROMPT" ? "Prompt" : "Document");

  return (
    <section className="rounded-xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Autocomplete</span>
          <div className="inline-grid grid-cols-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-gray-900 p-0.5 text-xs font-semibold">
            {(["FILE", "PROMPT"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setSourceMode(mode);
                  setResult(null);
                }}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  sourceMode === mode
                    ? "bg-[#2D6A4F] text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {mode === "FILE" ? "File" : "Prompt"}
              </button>
            ))}
          </div>
        </div>

        {sourceMode === "FILE" ? (
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
        ) : (
          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setResult(null);
            }}
            rows={4}
            placeholder="Generate case-study questions about trauma-informed care for beginner social workers."
            className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        )}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid grid-cols-2 gap-2 sm:w-64">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Provider
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as "GEMINI" | "OPENAI" | "DEEPSEEK")}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              >
                <option value="GEMINI">Gemini</option>
                <option value="OPENAI">OpenAI</option>
                <option value="DEEPSEEK">DeepSeek</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Model (Optional)
              <input
                type="text"
                placeholder="Default"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
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
            <span>{sourceLabel}</span>
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
