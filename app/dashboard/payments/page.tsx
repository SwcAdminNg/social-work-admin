"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAdminPayments } from "@/lib/api/payments-client";
import { TransactionReadDTO } from "@/lib/api/payments.types";
import { Pagination } from "@/components/generic/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconReceipt } from "@/components/dashboard/icons";
import Link from "next/link";

const PAGE_SIZE = 20;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: TransactionReadDTO["status"] }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" />
        Success
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
      Pending
    </span>
  );
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["admin_payments", page],
    queryFn: () => getAdminPayments(page, PAGE_SIZE),
    enabled: !!session,
    placeholderData: keepPreviousData,
  });

  const transactions = data?.items ?? [];
  const meta = data; // the whole data acts as meta since it has total_pages etc.

  const columns: DataTableColumn<TransactionReadDTO>[] = [
    {
      key: "date",
      header: "Date",
      render: (txn) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(txn.created_at)}</span>,
    },
    {
      key: "user",
      header: "User",
      render: (txn) => (
        <Link 
          href={`/dashboard/user-management/${txn.user.id}`}
          className="flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800 p-1 -ml-1 rounded transition-colors"
        >
          <span className="text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788]">
            {txn.user.full_name || `${txn.user.first_name || ""} ${txn.user.last_name || ""}`.trim() || "User"}
          </span>
          <span className="text-xs text-gray-500">{txn.user.email}</span>
        </Link>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (txn) => <span className="text-sm font-mono text-gray-900 dark:text-white">{txn.reference}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (txn) => <span className="text-sm font-semibold text-gray-900 dark:text-white">₦{txn.amount.toLocaleString()}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (txn) => <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{txn.transaction_type}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (txn) => <StatusBadge status={txn.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
          Failed to fetch transactions. Please try again later.
        </div>
      )}

      {!isError && (
        <div className={`transition-opacity duration-200 ${isFetching && transactions.length > 0 ? "opacity-60" : ""}`}>
          <DataTable
            columns={columns}
            data={transactions}
            keyExtractor={(txn) => txn.id}
            loading={isLoading}
            skeletonRows={10}
            cardTitle={(txn) => <span>{txn.reference}</span>}
            emptyState={
              <EmptyState
                icon={IconReceipt}
                title="No transactions found"
                description="There are no payments recorded yet."
              />
            }
          />
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <Pagination currentPage={page} totalPages={meta.total_pages} onPageChange={setPage} />
      )}
    </div>
  );
}
