"use client";

import * as React from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  /** Omit this column from the auto-generated mobile card body (e.g. because `cardTitle` already shows it). */
  hideInCard?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  /** Prominent header rendered at the top of each mobile card (e.g. avatar + name). */
  cardTitle?: (row: T) => React.ReactNode;
  /** Rendered as the trailing column on desktop and inside the card header on mobile. */
  actions?: (row: T) => React.ReactNode;
};

export function DataTable<T,>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyState,
  cardTitle,
  actions,
}: DataTableProps<T>) {
  if (!loading && data.length === 0) {
    return <>{emptyState}</>;
  }

  const cardColumns = cardTitle ? columns.filter((col) => !col.hideInCard) : columns;

  return (
    <div className="w-full">
      <div className="hidden sm:block rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 ${col.headerClassName ?? ""}`}
                  >
                    {col.header}
                  </th>
                ))}
                {actions && (
                  <th scope="col" className="px-4 py-3.5">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading
                ? Array.from({ length: skeletonRows }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-4">
                          <div className="h-3.5 w-3/4 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-4">
                          <div className="h-3.5 w-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse ml-auto" />
                        </td>
                      )}
                    </tr>
                  ))
                : data.map((row) => (
                    <tr
                      key={keyExtractor(row)}
                      className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-4 align-middle text-sm text-gray-700 dark:text-gray-300 ${col.cellClassName ?? ""}`}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {loading
          ? Array.from({ length: skeletonRows }).map((_, i) => (
              <div
                key={`skeleton-card-${i}`}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                <div className="h-4 w-2/5 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mb-3" />
                <div className="h-3 w-3/5 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
              </div>
            ))
          : data.map((row) => (
              <div
                key={keyExtractor(row)}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">{cardTitle ? cardTitle(row) : null}</div>
                  {actions && <div className="flex items-center gap-1 shrink-0">{actions(row)}</div>}
                </div>
                {cardColumns.length > 0 && (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {cardColumns.map((col) => (
                      <div key={col.key} className="min-w-0">
                        <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-1">
                          {col.header}
                        </dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300 truncate">{col.render(row)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
