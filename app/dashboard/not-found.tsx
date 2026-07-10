"use client";

import Link from "next/link";
import { IconBookOpen } from "@/components/dashboard/icons";

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] rounded-2xl flex items-center justify-center mb-6">
        <IconBookOpen />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        We couldn't find the page you're looking for. It might have been removed, renamed, or didn't exist in the first place.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl shadow-lg shadow-green-900/20 transition-all duration-200"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
