"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/primitives";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-5">
        <div className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
