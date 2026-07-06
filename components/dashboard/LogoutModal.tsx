"use client";

import { signOut } from "next-auth/react";

export function LogoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl flex flex-col gap-4 text-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Confirm Logout
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to log out of your account?
        </p>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 flex-1 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 flex-1 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors duration-150 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
