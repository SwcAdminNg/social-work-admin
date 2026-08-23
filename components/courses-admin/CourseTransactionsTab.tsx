"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCourseTransactions } from "@/lib/api/customer-support";
import { CourseTransactionReadDTO } from "@/lib/api/payments.types";
import { DataTable } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/generic/ui/Pagination";
import { IconReceipt } from "@/components/dashboard/icons";
import { StatTile } from "./StatTile";
import Link from "next/link";

const PAGE_SIZE = 10;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Success</span>;
  }
  if (status === "FAILED") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Failed</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">Pending</span>;
}

function PaymentIcon({ cardType }: { cardType: string | null }) {
  if (!cardType) return <span className="text-xs text-gray-400 dark:text-gray-500">Other</span>;
  const type = cardType.toLowerCase();
  if (type.includes("visa")) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-5 bg-blue-600 text-white font-bold rounded-sm text-[0.55rem] tracking-wider italic">
        VISA
      </span>
    );
  }
  if (type.includes("mastercard")) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-5 bg-transparent border border-gray-200 dark:border-gray-700 rounded-sm relative overflow-hidden">
        <span className="w-3 h-3 rounded-full bg-red-500 absolute left-1 mix-blend-multiply opacity-80"></span>
        <span className="w-3 h-3 rounded-full bg-yellow-500 absolute right-1 mix-blend-multiply opacity-80"></span>
      </span>
    );
  }
  return <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{type}</span>;
}

export function CourseTransactionsTab({ courseId }: { courseId: string }) {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["course_transactions", courseId, page],
    queryFn: () => getCourseTransactions(courseId, page, PAGE_SIZE),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full sm:w-64">
        <StatTile icon={IconReceipt} label="Total transactions" value={data?.total_items ?? (isLoading ? "…" : 0)} />
      </div>

      <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sales & Transactions</h2>

        <DataTable
          columns={[
            { key: "date", header: "Date", render: (t) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(t.created_at)}</span> },
            {
              key: "user",
              header: "User",
              render: (t) => (
                <Link
                  href={`/dashboard/user-management/${t.user.id}`}
                  className="flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800 p-1 -ml-1 rounded transition-colors"
                >
                  <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788]">
                    {t.user.full_name || `${t.user.first_name || ""} ${t.user.last_name || ""}`.trim() || "User"}
                  </span>
                  <span className="text-xs text-gray-500">{t.user.email}</span>
                </Link>
              )
            },
            { key: "amount", header: "Amount", render: (t) => <span className="text-sm font-bold text-gray-900 dark:text-white">₦{t.amount.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
            {
              key: "method",
              header: "Payment Method",
              render: (t) => (
                <div className="flex items-center gap-2">
                  <PaymentIcon cardType={t.card_type} />
                </div>
              )
            },
          ]}
          data={data?.items ?? []}
          keyExtractor={(t) => t.id}
          loading={isLoading}
          emptyState={<EmptyState icon={IconReceipt} title="No sales yet" description="This course hasn't had any direct transactions." />}
        />

        {data && data.total_pages > 1 && (
          <Pagination currentPage={page} totalPages={data.total_pages} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
