"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getContactMessages } from "@/lib/api/contact-client";
import type { ContactMessage } from "@/lib/api/contact.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import {
  IconMail,
  IconX,
  IconSpinner,
} from "@/components/dashboard/icons";

interface ContactMessagesListProps {
  initialData: PaginatedResult<ContactMessage>;
}

export function ContactMessagesList({ initialData }: ContactMessagesListProps) {
  const [data, setData] = useState<PaginatedResult<ContactMessage>>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await getContactMessages(page, data.meta.page_size);
      setData(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [data.meta.page_size]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

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

        {/* List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Sender</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Platform</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <IconMail />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          No messages found.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.items.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap" suppressHydrationWarning>
                        {formatDate(msg.created_at)}
                      </td>
                      <td className="px-5 py-4">
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
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {msg.category || "General"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                          {msg.platform}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(msg)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                        >
                          View Message
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/30">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing page {data.meta.page} of {data.meta.total_pages} ({data.meta.total_items} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || !data.meta.has_previous}
                onClick={() => fetchPage(data.meta.page - 1)}
                className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={loading || !data.meta.has_next}
                onClick={() => fetchPage(data.meta.page + 1)}
                className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                {loading ? <IconSpinner className="w-4 h-4" /> : null}
                Next
              </button>
            </div>
          </div>
        </div>
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
