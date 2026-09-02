"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Payments & Plans</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage all incoming payments and subscription plans.
        </p>
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/dashboard/payments"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/dashboard/payments"
              ? "border-[#2D6A4F] dark:border-[#52b788] text-[#2D6A4F] dark:text-[#52b788]"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Transactions
        </Link>
        <Link
          href="/dashboard/payments/plans"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname.startsWith("/dashboard/payments/plans")
              ? "border-[#2D6A4F] dark:border-[#52b788] text-[#2D6A4F] dark:text-[#52b788]"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Subscription Plans
        </Link>
        <Link
          href="/dashboard/payments/coupons"
          className={`px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            pathname.startsWith("/dashboard/payments/coupons")
              ? "border-[#2D6A4F] dark:border-[#52b788] text-[#2D6A4F] dark:text-[#52b788]"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          Coupons
        </Link>
      </div>
      <div>{children}</div>
    </div>
  );
}
