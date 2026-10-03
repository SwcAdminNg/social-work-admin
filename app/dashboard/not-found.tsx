"use client";

import Link from "next/link";
import { IconBookOpen } from "@/components/dashboard/icons";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-brand-600/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mb-6">
        <IconBookOpen />
      </div>
      <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-green-900/20 transition-all duration-200"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
