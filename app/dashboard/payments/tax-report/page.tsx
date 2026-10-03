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
import { Avatar } from "@/components/ui/primitives";
import { DateRangePicker, formatValue, type DateRangeValue } from "@/components/ui/date-picker";

const todayValue = () => formatValue(new Date(), "date");

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

  function handleRangeChange(range: DateRangeValue) {
    setStartDate(range.start);
    setEndDate(range.end);
    setPage(1);
    setAppliedRange({ startDate: range.start || undefined, endDate: range.end || undefined });
  }

  const columns: DataTableColumn<TaxReportTransaction>[] = [
    {
      key: "date",
      header: "Date",
      render: (txn) => <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(txn.created_at)}</span>,
    },
    {
      key: "reference",
      header: "Reference",
      render: (txn) => <span className="text-sm font-mono text-slate-900 dark:text-white">{txn.reference}</span>,
    },
    {
      key: "user",
      header: "User",
      render: (txn) =>
        txn.user_name ? (
          <Link
            href={`/dashboard/user-management/${txn.user_id}`}
            className="group flex min-w-0 items-center gap-2.5 no-underline"
          >
            <Avatar name={txn.user_name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                {txn.user_name}
              </span>
              {txn.user_email && (
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{txn.user_email}</span>
              )}
            </span>
          </Link>
        ) : (
          <span className="text-sm italic text-slate-400" title={txn.user_id}>
            Deleted account
          </span>
        ),
    },
    {
      key: "type",
      header: "Type",
      render: (txn) => <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{txn.transaction_type}</span>,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (txn) => <span className="text-sm text-slate-700 dark:text-slate-300">{formatMoney(txn.subtotal_amount)}</span>,
    },
    {
      key: "discount",
      header: "Discount",
      render: (txn) => <span className="text-sm text-slate-700 dark:text-slate-300">{formatMoney(txn.discount_amount)}</span>,
    },
    {
      key: "tax_rate",
      header: "Tax Rate",
      render: (txn) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">{(txn.tax_rate * 100).toFixed(1)}%</span>
      ),
    },
    {
      key: "tax_amount",
      header: "VAT",
      render: (txn) => (
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatMoney(txn.tax_amount)}</span>
      ),
    },
    {
      key: "amount",
      header: "Total Charged",
      render: (txn) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMoney(txn.amount)}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface p-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
          <label htmlFor="tax-report-range" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Date range
          </label>
          <DateRangePicker
            id="tax-report-range"
            title="Tax report period"
            presets="past"
            max={todayValue()}
            start={startDate}
            end={endDate}
            onChange={handleRangeChange}
            placeholder="All time"
          />
        </div>
        {isFetching && (appliedRange.startDate || appliedRange.endDate) && (
          <p className="text-xs font-medium text-slate-400 sm:pb-3">Updating…</p>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total VAT Collected
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatMoney(summary.total_tax_amount)}
            </div>
            {(summary.start_date || summary.end_date) && (
              <div className="mt-1 text-xs text-slate-400">
                {summary.start_date ?? "beginning"} → {summary.end_date ?? "now"}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Taxable Transactions
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {summary.total_taxable_transactions.toLocaleString()}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              VAT Rate
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
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
