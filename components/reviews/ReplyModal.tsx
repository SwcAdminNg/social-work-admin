"use client";

import { useState } from "react";
import { Modal } from "@/components/generic/ui/Modal";
import { CourseReview } from "@/lib/api/courses.types";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: CourseReview | null;
  onSubmit: (replyText: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ReplyModal({
  isOpen,
  onClose,
  review,
  onSubmit,
  isSubmitting,
}: ReplyModalProps) {
  const [replyText, setReplyText] = useState("");

  // When modal opens with a review, populate existing reply if any
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(replyText);
    setReplyText("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reply to Review"
    >
      <div className="space-y-4 mb-6 mt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Respond to {review?.user.first_name}'s review on {review?.course?.title || "the course"}.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm italic text-slate-700 dark:text-slate-300">
          "{review?.review_text || "No text provided."}"
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reply_text"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Your Reply
          </label>
          <textarea
            id="reply_text"
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            required
            placeholder="Type your response here..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-ink-surface text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-600 focus:ring-brand-600 dark:focus:border-brand-400 dark:focus:ring-brand-400 transition-colors resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !replyText.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Reply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
