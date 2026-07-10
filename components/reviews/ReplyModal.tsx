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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Respond to {review?.user.first_name}'s review on {review?.course?.title || "the course"}.
        </p>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm italic text-gray-700 dark:text-gray-300">
          "{review?.review_text || "No text provided."}"
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reply_text"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#2D6A4F] focus:ring-[#2D6A4F] dark:focus:border-[#52b788] dark:focus:ring-[#52b788] transition-colors resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !replyText.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Reply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
