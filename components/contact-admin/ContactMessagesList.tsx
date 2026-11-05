"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getContactMessages } from "@/lib/api/contact-client";
import type { ContactMessage } from "@/lib/api/contact.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import type { ContactMessagesFilters } from "@/lib/api/contact-client";
import {
  IconMail,
  IconX,
  IconSpinner,
} from "@/components/dashboard/icons";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { Pagination } from "@/components/generic/ui/Pagination";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DateRangePicker, type DateRangeValue } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { CONTACT_SOURCE_PAGES, formatSourcePage } from "@/lib/api/contact-pages";
import { CONTACT_CATEGORIES, formatCategory } from "@/lib/api/contact-categories";

function replyHref(msg: ContactMessage): string {
  const topic = msg.subject || formatCategory(msg.category, msg.category_label);
  const subject = `Re: ${topic}${msg.reference ? ` (${msg.reference})` : ""}`;
  return `mailto:${msg.email}?subject=${encodeURIComponent(subject)}`;
}

interface ContactMessagesListProps {
  initialData: PaginatedResult<ContactMessage>;
}

export function ContactMessagesList({ initialData }: ContactMessagesListProps) {
  const [data, setData] = useState<PaginatedResult<ContactMessage>>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filters, setFilters] = useState<ContactMessagesFilters>({
    search: "",
    platform: "",
    category: "",
    source_page: "",
    start_date: "",
    end_date: "",
  });

  const fetchPage = useCallback(async (page: number, currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await getContactMessages(page, data.meta.page_size, currentFilters);
      setData(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [data.meta.page_size, filters]);

  const handleFilterChange = (key: keyof ContactMessagesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // The picker has its own Apply, so a new range is fetched straight away.
  const handleDateRangeChange = ({ start, end }: DateRangeValue) => {
    const next = { ...filters, start_date: start, end_date: end };
    setFilters(next);
    fetchPage(1, next);
  };

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchPage(1, filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      platform: "",
      category: "",
      source_page: "",
      start_date: "",
      end_date: "",
    };
    setFilters(emptyFilters);
    fetchPage(1, emptyFilters);
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  const columns: DataTableColumn<ContactMessage>[] = [
    {
      key: "date",
      header: "Date",
      render: (msg) => (
        <span className="whitespace-nowrap" suppressHydrationWarning>
          {formatDate(msg.created_at)}
        </span>
      ),
    },
    {
      key: "sender",
      header: "Sender",
      hideInCard: true,
      render: (msg) => (
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {msg.full_name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {msg.email}
          </p>
          {msg.company_name && (
            <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
              {msg.company_name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (msg) => (
        <span className="text-sm">{formatCategory(msg.category, msg.category_label)}</span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      render: (msg) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {msg.reference ?? "—"}
        </span>
      ),
    },
    {
      key: "source_page",
      header: "Page",
      render: (msg) => (
        <span className="text-sm text-slate-700 dark:text-slate-300" title={msg.source_page || undefined}>
          {formatSourcePage(msg.source_page)}
        </span>
      ),
    },
    {
      key: "platform",
      header: "Platform",
      render: (msg) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
          {msg.platform}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Contact Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and manage all incoming enquiries from the website forms, with the page each was sent from.
          </p>
        </div>

        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white dark:bg-ink-surface p-4 border border-slate-200 dark:border-ink-line rounded-2xl flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Search</label>
              <input
                type="text"
                placeholder="Name, email or SWCL-…"
                className="px-3 py-2 text-sm bg-white dark:bg-ink-page/60 border border-slate-200 dark:border-ink-line rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 text-slate-900 dark:text-white"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Platform</label>
              <Select
                value={filters.platform}
                onChange={(value) => handleFilterChange("platform", value)}
              >
                <option value="">All Platforms</option>
                <option value="NG">NG</option>
                <option value="COM">COM</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Category</label>
              <Select
                value={filters.category}
                onChange={(value) => handleFilterChange("category", value)}
              >
                <option value="">All Categories</option>
                {CONTACT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Page</label>
              <Select
                value={filters.source_page ?? ""}
                onChange={(value) => handleFilterChange("source_page", value)}
              >
                <option value="">All Pages</option>
                {CONTACT_SOURCE_PAGES.map((page) => (
                  <option key={page.path} value={page.path}>
                    {page.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="contact-date-range" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Date Received</label>
              <DateRangePicker
                id="contact-date-range"
                title="Messages received between"
                presets="past"
                start={filters.start_date ?? ""}
                end={filters.end_date ?? ""}
                onChange={handleDateRangeChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading ? <IconSpinner className="w-4 h-4" /> : null}
              Apply Filters
            </button>
          </div>
        </form>

        {/* List */}
        <div className={`transition-opacity duration-200 ${loading && data.items.length > 0 ? "opacity-60" : ""}`}>
          <DataTable
            columns={columns}
            data={data.items}
            keyExtractor={(msg) => msg.id}
            loading={loading && data.items.length === 0}
            skeletonRows={5}
            cardTitle={(msg) => (
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {msg.full_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.email}</p>
                </div>
              </div>
            )}
            actions={(msg) => (
              <button
                type="button"
                onClick={() => setSelectedMessage(msg)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                View
              </button>
            )}
            emptyState={
              <EmptyState
                icon={IconMail}
                title="No messages found"
                description="Try adjusting your search or filters."
              />
            }
          />
        </div>

        {data.meta.total_pages > 1 && (
          <Pagination
            currentPage={data.meta.page}
            totalPages={data.meta.total_pages}
            onPageChange={(p) => fetchPage(p)}
          />
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMessage(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-ink-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-ink-line flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-ink-line flex-shrink-0">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Message Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Sent on {formatDate(selectedMessage.created_at)}
                  {selectedMessage.reference && (
                    <>
                      {" · "}
                      <span className="font-mono text-xs">{selectedMessage.reference}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Sender Info
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedMessage.full_name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <a href={`mailto:${selectedMessage.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {selectedMessage.email}
                    </a>
                  </p>
                  {selectedMessage.phone_number ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <a href={`tel:${selectedMessage.phone_number}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {selectedMessage.phone_number}
                      </a>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500">No phone number given</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Additional Info
                  </p>
                  {selectedMessage.company_name && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Company:</span> {selectedMessage.company_name}
                    </p>
                  )}
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Enquiry type:</span>{" "}
                    {formatCategory(selectedMessage.category, selectedMessage.category_label)}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Platform:</span> {selectedMessage.platform}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Sent from:</span> {formatSourcePage(selectedMessage.source_page)}
                    {selectedMessage.source_page && (
                      <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({selectedMessage.source_page})</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedMessage.subject && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    Subject
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedMessage.subject}
                  </p>
                </div>
              )}

              {selectedMessage.details && selectedMessage.details.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Form Answers
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-[minmax(0,12rem)_1fr] gap-x-4 gap-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-ink-line">
                    {selectedMessage.details.map((detail, index) => (
                      <div key={`${detail.label}-${index}`} className="contents">
                        <dt className="text-sm font-semibold text-slate-600 dark:text-slate-400">{detail.label}</dt>
                        <dd className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words m-0">{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Message Content
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-ink-line">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <a
                  href={replyHref(selectedMessage)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <IconMail />
                  Reply by email
                </a>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-ink-line bg-slate-50 dark:bg-slate-800/30 flex justify-end flex-shrink-0">
               <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
