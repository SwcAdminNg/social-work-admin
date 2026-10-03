"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PAGE_BUTTON =
  "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";
const PAGE_IDLE =
  "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - halfMaxPages);
      let endPage = Math.min(totalPages, currentPage + halfMaxPages);

      if (currentPage <= halfMaxPages) {
        endPage = maxPagesToShow;
      }

      if (currentPage + halfMaxPages >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
      }

      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push("...");
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push("...");
        }
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-5 dark:border-ink-line dark:bg-ink-surface">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">
        Page <span className="font-semibold text-slate-800 dark:text-slate-100">{currentPage}</span> of{" "}
        <span className="font-semibold text-slate-800 dark:text-slate-100">{totalPages}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`${PAGE_BUTTON} ${PAGE_IDLE}`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Prev</span>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {getPageNumbers().map((page, index) =>
            typeof page === "number" ? (
              <button
                type="button"
                key={index}
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={`${PAGE_BUTTON} ${
                  currentPage === page
                    ? "bg-brand-600 text-white shadow-[0_8px_20px_-12px_rgba(45,106,79,0.9)] dark:bg-brand-400 dark:text-[#06130d]"
                    : PAGE_IDLE
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-1 text-[13px] text-slate-400">
                {page}
              </span>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`${PAGE_BUTTON} ${PAGE_IDLE}`}
        >
          <span className="sr-only sm:not-sr-only">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
