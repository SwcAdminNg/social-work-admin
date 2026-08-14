"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { updateAssessmentSettings } from "@/lib/api/courses-client";
import type { CourseItem } from "@/lib/api/courses.types";
import { IconSpinner } from "@/components/dashboard/icons";
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
  if (!essay) return null;

  const [question, setQuestion] = useState(essay.question);
  const [description, setDescription] = useState(essay.description);
  const [submissionMode, setSubmissionMode] = useState<"TEXT" | "DOCUMENT">(essay.submission_mode);
  const [dueDate, setDueDate] = useState<string>(item.assessment?.due_date ? item.assessment.due_date.slice(0, 16) : "");
  
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
