"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  approveInstructorApplication,
  getInstructorApplication,
  rejectInstructorApplication,
  resendInstructorApplicationSetupLink,
} from "@/lib/api/instructor-applications-client";
import type { ApproveInstructorApplicationPayload, InstructorApplicationDetail as InstructorApplicationDetailType } from "@/lib/api/instructor-applications.types";
import { StatusBadge } from "./ApplicationQueueList";
import { Modal } from "@/components/generic/ui/Modal";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  IconAlertTriangle,
  IconDocument,
  IconSpinner,
  IconUserPlus,
  IconMail,
} from "@/components/dashboard/icons";

function applicantName(app: InstructorApplicationDetailType): string {
  const name = [app.first_name, app.last_name].filter(Boolean).join(" ");
  return name || app.email;
}

function formatTimestamp(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ApproveModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ApproveInstructorApplicationPayload) => void;
  isLoading: boolean;
}) {
  const [platform, setPlatform] = useState<"NG" | "COM">("NG");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Application" maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ platform });
        }}
        className="flex flex-col gap-5"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The applicant will be emailed a 7-day setup link to create their username, password, and 2FA. Their account
          stays inactive until they finish setup.
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="approve-platform" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Platform
          </label>
          <select
            id="approve-platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as "NG" | "COM")}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
          >
            <option value="NG">NG</option>
            <option value="COM">COM</option>
          </select>
          <p className="text-xs text-slate-400">Determines which storefront&apos;s instructor account is created.</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading && <IconSpinner className="w-4 h-4" />}
            {isLoading ? "Approving..." : "Approve"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RejectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Application" maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(reason.trim());
        }}
        className="flex flex-col gap-5"
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No account is created. The applicant is notified by email and may submit a new application at any time.
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-reason" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Reason <span className="text-slate-400 font-normal">(optional, shown to the applicant)</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. CV did not demonstrate relevant teaching experience"
            className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading && <IconSpinner className="w-4 h-4" />}
            {isLoading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ApplicationDetail({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resendConfirmOpen, setResendConfirmOpen] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const applicationQuery = useQuery({
    queryKey: ["instructor_application", applicationId],
    queryFn: () => getInstructorApplication(applicationId),
    retry: (failureCount, error) => error instanceof ApiError && error.status !== 403 && error.status !== 404 && failureCount < 2,
  });

  const approveMutation = useMutation({
    mutationFn: (payload: ApproveInstructorApplicationPayload) => approveInstructorApplication(applicationId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["instructor_application", applicationId], updated);
      setApproveOpen(false);
      toast.success("Application approved. The applicant has been emailed a setup link.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to approve application.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectInstructorApplication(applicationId, { reason: reason || null }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["instructor_application", applicationId], updated);
      setRejectOpen(false);
      toast.success("Application rejected. The applicant has been notified by email.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to reject application.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendInstructorApplicationSetupLink(applicationId),
    onSuccess: () => {
      setResendConfirmOpen(false);
      setResendNotice(null);
      toast.success("A fresh setup link has been emailed to the applicant.");
    },
    onError: (err: unknown) => {
      setResendConfirmOpen(false);
      if (err instanceof ApiError && err.status === 400) {
        // Both 400 cases here are legitimate, expected states (not approved yet / setup
        // already done) — surface them inline rather than as a generic error toast.
        setResendNotice(err.message);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to resend setup link.");
      }
    },
  });

  const application = applicationQuery.data;

  if (applicationQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconSpinner className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  if (applicationQuery.isError || !application) {
    const status = applicationQuery.error instanceof ApiError ? applicationQuery.error.status : null;
    return (
      <EmptyState
        icon={IconUserPlus}
        title={status === 404 ? "Application not found" : "Failed to load application"}
        description={status === 404 ? "This application may have been removed." : "Something went wrong. Try refreshing the page."}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/instructor-applications")}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
        >
          &larr; Back to Instructor Applications
        </button>
      </div>

      <div className="flex flex-col gap-4 p-6 bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{applicantName(application)}</h1>
              <StatusBadge status={application.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {application.email}
              {application.phone_number ? ` · ${application.phone_number}` : ""}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1" suppressHydrationWarning>
              Applied {formatTimestamp(application.created_at)}
            </p>
          </div>

          {application.status === "PENDING" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-lg transition-colors cursor-pointer"
              >
                Approve
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-ink-line">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 block mb-2">Curriculum Vitae</span>
          {application.cv_download_url ? (
            <a
              href={application.cv_download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-600/10 dark:bg-brand-400/15 hover:bg-brand-600/20 dark:hover:bg-brand-400/25 rounded-lg transition-colors"
            >
              <IconDocument />
              Download {application.cv_file_name}
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-slate-400">
              <IconDocument />
              {application.cv_file_name}
            </span>
          )}
        </div>
      </div>

      {application.status === "APPROVED" && (
        <div className="flex flex-col gap-4 p-6 bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Account Setup</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Reviewed {formatTimestamp(application.reviewed_at)}. An inactive instructor account has been created —
                the applicant can&apos;t log in until they finish setup via their emailed link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResendNotice(null);
                setResendConfirmOpen(true);
              }}
              disabled={resendMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              {resendMutation.isPending ? <IconSpinner className="w-4 h-4" /> : <IconMail />}
              Resend Setup Link
            </button>
          </div>

          {resendNotice && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-400">
              <IconAlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{resendNotice}</span>
            </div>
          )}
        </div>
      )}

      {application.status === "REJECTED" && (
        <div className="flex flex-col gap-2 p-6 bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-2xl">
          <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Rejection Reason</h2>
          {application.rejection_reason ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{application.rejection_reason}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No reason was given.</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Reviewed {formatTimestamp(application.reviewed_at)}</p>
        </div>
      )}

      <ApproveModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        onSubmit={(payload) => approveMutation.mutate(payload)}
        isLoading={approveMutation.isPending}
      />

      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(reason) => rejectMutation.mutate(reason)}
        isLoading={rejectMutation.isPending}
      />

      <ConfirmModal
        isOpen={resendConfirmOpen}
        onClose={() => setResendConfirmOpen(false)}
        onConfirm={() => resendMutation.mutate()}
        title="Resend Setup Link"
        description="This invalidates any previously issued setup link — only one stays active at a time. Continue?"
        confirmText="Resend"
        isLoading={resendMutation.isPending}
      />
    </div>
  );
}
