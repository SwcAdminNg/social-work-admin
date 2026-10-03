"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payments & Plans</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage all incoming payments and subscription plans.
        </p>
      </div>

      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-ink-line">
        <Link
          href="/dashboard/payments"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/dashboard/payments"
              ? "border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Transactions
        </Link>
        <Link
          href="/dashboard/payments/plans"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname.startsWith("/dashboard/payments/plans")
              ? "border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Subscription Plans
        </Link>
        <Link
          href="/dashboard/payments/coupons"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname.startsWith("/dashboard/payments/coupons")
              ? "border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Coupons
        </Link>
        <Link
          href="/dashboard/payments/tax-report"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname.startsWith("/dashboard/payments/tax-report")
              ? "border-brand-600 dark:border-brand-400 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Tax Report
        </Link>
      </div>
      <div>{children}</div>
    </div>
  );
}
