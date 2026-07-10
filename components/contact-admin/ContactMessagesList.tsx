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

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchPage(1, filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      platform: "",
      category: "",
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
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {msg.full_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {msg.email}
          </p>
          {msg.company_name && (
            <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">
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
        <span className="capitalize">{msg.category || "General"}</span>
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
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Contact Messages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all incoming messages from the "Contact Us" form.
          </p>
        </div>

        {/* Filters */}
        <form onSubmit={applyFilters} className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Search</label>
              <input
                type="text"
                placeholder="Name, email..."
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Platform</label>
              <select
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                value={filters.platform}
                onChange={(e) => handleFilterChange("platform", e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="NG">NG</option>
                <option value="COM">COM</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</label>
              <select
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="mentorship">Mentorship</option>
                <option value="pricing">Pricing</option>
                <option value="courses">Courses</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {msg.full_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.email}</p>
                </div>
              </div>
            )}
            actions={(msg) => (
              <button
                type="button"
                onClick={() => setSelectedMessage(msg)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
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
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Message Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sent on {formatDate(selectedMessage.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Sender Info
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedMessage.full_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <a href={`mailto:${selectedMessage.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {selectedMessage.email}
                    </a>
                  </p>
                  {selectedMessage.phone_number && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <a href={`tel:${selectedMessage.phone_number}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {selectedMessage.phone_number}
                      </a>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Additional Info
                  </p>
                  {selectedMessage.company_name && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Company:</span> {selectedMessage.company_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    <span className="font-semibold">Category:</span> {selectedMessage.category || "General"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Platform:</span> {selectedMessage.platform}
                  </p>
                </div>
              </div>

              {selectedMessage.subject && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Subject
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedMessage.subject}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Message Content
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end flex-shrink-0">
               <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
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
