"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTaxReport } from "@/lib/api/payments-client";
import { TaxReportTransaction } from "@/lib/api/payments.types";
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

function formatMoney(n: number): string {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TaxReportPage() {
  const { data: session } = useSession();
  const [page, setPage] = React.useState(1);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [appliedRange, setAppliedRange] = React.useState<{ startDate?: string; endDate?: string }>({});

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["admin_tax_report", page, appliedRange.startDate, appliedRange.endDate],
    queryFn: () =>
      getTaxReport({
        startDate: appliedRange.startDate,
        endDate: appliedRange.endDate,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!session,
    placeholderData: keepPreviousData,
  });

  const transactions = data?.items ?? [];
  const summary = data?.summary;

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setAppliedRange({ startDate: startDate || undefined, endDate: endDate || undefined });
  }

  function handleClearFilters() {
    setStartDate("");
    setEndDate("");
    setPage(1);
    setAppliedRange({});
  }

  const columns: DataTableColumn<TaxReportTransaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (txn) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(txn.created_at)}</span>,
    },
    {
      key: "reference",
      header: "Reference",
      render: (txn) => <span className="text-sm font-mono text-gray-900 dark:text-white">{txn.reference}</span>,
    },
    {
      key: "user",
      header: "User",
      render: (txn) => (
        <Link
          href={`/dashboard/user-management/${txn.user_id}`}
          className="text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline"
        >
          {txn.user_id}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (txn) => <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{txn.transaction_type}</span>,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (txn) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatMoney(txn.subtotal_amount)}</span>,
    },
    {
      key: "discount",
      header: "Discount",
      render: (txn) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatMoney(txn.discount_amount)}</span>,
    },
    {
      key: "tax_rate",
      header: "Tax Rate",
      render: (txn) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{(txn.tax_rate * 100).toFixed(1)}%</span>
      ),
    },
    {
      key: "tax_amount",
      header: "VAT",
      render: (txn) => (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(txn.tax_amount)}</span>
      ),
    },
    {
      key: "amount",
      header: "Total Charged",
      render: (txn) => (
        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(txn.amount)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleApplyFilters}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors shadow-sm"
        >
          Apply
        </button>
        {(appliedRange.startDate || appliedRange.endDate) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total VAT Collected
            </div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
              {formatMoney(summary.total_tax_amount)}
            </div>
            {(summary.start_date || summary.end_date) && (
              <div className="mt-1 text-xs text-gray-400">
                {summary.start_date ?? "beginning"} → {summary.end_date ?? "now"}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Taxable Transactions
            </div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
              {summary.total_taxable_transactions.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              VAT Rate
            </div>
            <div className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-white">
              {(summary.tax_rate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
          Failed to fetch tax report. Please try again later.
        </div>
      )}

      {!isError && (
        <div className={`transition-opacity duration-200 ${isFetching && transactions.length > 0 ? "opacity-60" : ""}`}>
          <DataTable
            columns={columns}
            data={transactions}
            keyExtractor={(txn) => txn.reference}
            loading={isLoading}
            skeletonRows={10}
            cardTitle={(txn) => <span className="font-mono text-sm">{txn.reference}</span>}
            emptyState={
              <EmptyState
                icon={IconReceipt}
                title="No taxable transactions found"
                description="There are no VAT-collected purchases in the selected date range."
              />
            }
          />
        </div>
      )}

      {data && data.total_pages > 1 && (
        <Pagination currentPage={page} totalPages={data.total_pages} onPageChange={setPage} />
      )}
    </div>
  );
}
