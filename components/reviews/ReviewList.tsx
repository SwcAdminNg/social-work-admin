"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { 
  getAllReviews, 
  deleteCourseReview, 
  hideCourseReview, 
  replyToCourseReview 
} from "@/lib/api/courses-client";
import { CourseReview } from "@/lib/api/courses.types";
import { Pagination } from "@/components/generic/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { ReplyModal } from "./ReplyModal";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconStar, IconMessageQuestion } from "@/components/dashboard/icons";
import Link from "next/link";

const PAGE_SIZE = 20;

function initials(user: any) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function ReviewerIdentity({ user, course }: { user: any; course: any }) {
  return (
    <div className="flex items-center gap-3 min-w-0 py-1">
      <div className="w-9 h-9 shrink-0 rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center text-xs font-bold">
        {initials(user)}
      </div>
      <div className="min-w-0 flex flex-col">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {user.first_name} {user.last_name}
        </p>
        {course && (
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 truncate max-w-[150px]">
              {course.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg 
          key={star} 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill={star <= rating ? "#F59E0B" : "none"} 
          stroke={star <= rating ? "#F59E0B" : "currentColor"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={star <= rating ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}
        >
          <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5L2.5 9.2l6.6-.7L12 2.5z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewActions({ 
  review, 
  onReply, 
  onConfirmAction 
}: { 
  review: CourseReview; 
  onReply: (review: CourseReview) => void;
  onConfirmAction: (type: "hide" | "unhide" | "delete", review: CourseReview) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
        >
          <DropdownMenu.Item asChild>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
              onClick={() => onReply(review)}
            >
              Reply
            </button>
          </DropdownMenu.Item>
          {review.is_hidden ? (
            <DropdownMenu.Item asChild>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                onClick={() => onConfirmAction("unhide", review)}
              >
                Unhide
              </button>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item asChild>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                onClick={() => onConfirmAction("hide", review)}
              >
                Hide
              </button>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <DropdownMenu.Item asChild>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
              onClick={() => onConfirmAction("delete", review)}
            >
              Delete
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ReviewList() {
  const [page, setPage] = React.useState(1);
  const [replyModalReview, setReplyModalReview] = React.useState<CourseReview | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<{ type: "hide" | "unhide" | "delete"; review: CourseReview } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin_reviews", page],
    queryFn: () => getAllReviews({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const hideMutation = useMutation({
    mutationFn: (args: { id: string; isHidden: boolean }) => hideCourseReview(args.id, { is_hidden: args.isHidden }),
    onSuccess: () => {
      toast.success(`Review ${confirmAction?.type === 'hide' ? 'hidden' : 'unhidden'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Failed to update review visibility");
      setConfirmAction(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCourseReview(id),
    onSuccess: () => {
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Failed to delete review");
      setConfirmAction(null);
    }
  });

  const replyMutation = useMutation({
    mutationFn: (args: { id: string; text: string }) => replyToCourseReview(args.id, { reply_text: args.text }),
    onSuccess: () => {
      toast.success("Reply posted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
      setReplyModalReview(null);
    },
    onError: () => {
      toast.error("Failed to post reply");
    }
  });

  const columns: DataTableColumn<CourseReview>[] = [
    {
      key: "reviewer",
      header: "Reviewer & Course",
      render: (r) => <ReviewerIdentity user={r.user} course={r.course} />,
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) => <RatingStars rating={r.rating} />,
    },
    {
      key: "review",
      header: "Review",
      render: (r) => (
        <div className="max-w-md py-1">
          <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {r.review_text || <span className="text-gray-400 italic">No comment provided</span>}
          </p>
          {r.reply_text && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Reply:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{r.reply_text}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        r.is_hidden ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Hidden
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Public
          </span>
        )
      ),
      hideInCard: true,
    },
    {
      key: "date",
      header: "Date",
      render: (r) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
      hideInCard: true,
    },
  ];

  const actions = (r: CourseReview) => (
    <ReviewActions 
      review={r} 
      onReply={setReplyModalReview}
      onConfirmAction={(type, review) => setConfirmAction({ type, review })}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Moderate and respond to user reviews across all courses.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <DataTable
          data={data?.items || []}
          columns={columns}
          keyExtractor={(r) => r.id}
          loading={isLoading}
          actions={actions}
          emptyState={
            <EmptyState
              icon={IconStar}
              title="No Reviews Yet"
              description="There are currently no course reviews. When students start reviewing courses, they will appear here."
            />
          }
          cardTitle={(r) => (
             <div className="flex flex-col gap-1">
               <ReviewerIdentity user={r.user} course={r.course} />
               <RatingStars rating={r.rating} />
             </div>
          )}
        />
        
        {data?.meta && data.meta.total_pages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
            <Pagination
              currentPage={page}
              totalPages={data.meta.total_pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <ReplyModal
        isOpen={!!replyModalReview}
        onClose={() => setReplyModalReview(null)}
        review={replyModalReview}
        isSubmitting={replyMutation.isPending}
        onSubmit={async (text) => {
          if (replyModalReview) {
            await replyMutation.mutateAsync({ id: replyModalReview.id, text });
          }
        }}
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "hide"
            ? "Hide Review"
            : confirmAction?.type === "unhide"
              ? "Unhide Review"
              : "Delete Review"
        }
        description={
          confirmAction?.type === "hide"
            ? "Are you sure you want to hide this review? It will no longer be visible to the public or count towards the course average."
            : confirmAction?.type === "unhide"
              ? "Are you sure you want to unhide this review? It will become visible to the public again."
              : "Are you sure you want to permanently delete this review? This action cannot be undone."
        }
        confirmText={
          confirmAction?.type === "hide"
            ? "Hide"
            : confirmAction?.type === "unhide"
              ? "Unhide"
              : "Delete"
        }
        isDestructive={confirmAction?.type === "delete" || confirmAction?.type === "hide"}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.type === "delete") {
            deleteMutation.mutate(confirmAction.review.id);
          } else {
            hideMutation.mutate({ 
              id: confirmAction.review.id, 
              isHidden: confirmAction.type === "hide" 
            });
          }
        }}
        isLoading={hideMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
