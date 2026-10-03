"use client";

import { IconSpinner } from "@/components/dashboard/icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={loading ? undefined : onCancel}
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line p-6 shadow-xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{description}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {loading && <IconSpinner className="text-white/80" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
