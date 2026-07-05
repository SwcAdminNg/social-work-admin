"use client";

import React from "react";
import { Modal } from "./Modal";

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
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col gap-5">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-70"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2 ${
              isDestructive 
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" 
                : "bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68]"
            }`}
          >
            {isLoading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
