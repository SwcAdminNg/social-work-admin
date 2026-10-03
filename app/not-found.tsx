"use client";

import Link from "next/link";
import { IconSearch } from "@/components/dashboard/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-page flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-brand-600/20 to-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-20" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md text-center">
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-brand-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
          <div className="relative w-24 h-24 bg-white dark:bg-ink-surface border border-slate-100 dark:border-ink-line rounded-3xl shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
            <span className="text-4xl font-black text-brand-600 dark:text-brand-400">
              404
            </span>
          </div>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Lost in space?
        </h1>
        
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
          We can't seem to find the page you're looking for. It might have been moved or deleted.
        </p>

        <Link
          href="/"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 text-white text-sm font-bold rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-green-900/30 hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10 flex items-center gap-2">
            <IconSearch className="w-4 h-4" />
            Return Home
          </span>
        </Link>
      </div>
    </div>
  );
}
