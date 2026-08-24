"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  assignTicket,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
  setTicketStatus,
} from "@/lib/api/support-client";
import { getUsers } from "@/lib/api/users";
import type { TicketMessage, TicketStatus } from "@/lib/api/support.types";
import { StatusBadge } from "./TicketQueueList";
import { IconSend, IconSpinner, IconStar, IconAlertTriangle } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconLifeBuoy } from "@/components/dashboard/icons";

const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const MESSAGES_POLL_MS = 5_000;
const TICKET_POLL_MS = 15_000;

function personName(person?: { first_name?: string; last_name?: string; username?: string; email?: string } | null) {
  if (!person) return "";
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
  return name || person.username || person.email || "";
}

function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const ticketQuery = useQuery({
    queryKey: ["support_ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: TICKET_POLL_MS,
  });

  const messagesQuery = useQuery({
    queryKey: ["support_ticket_messages", ticketId],
    queryFn: () => getTicketMessages(ticketId, 1, 100),
    refetchInterval: MESSAGES_POLL_MS,
  });

  const adminsQuery = useQuery({
    queryKey: ["admin_users_for_assign"],
    queryFn: () => getUsers({ userType: "ADMIN", pageSize: 100 }),
    staleTime: 60_000,
  });

  const messages = messagesQuery.data?.items ?? [];
  const prevCount = useRef(0);
  useEffect(() => {
    if (messages.length !== prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCount.current = messages.length;
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => sendTicketMessage(ticketId, message),
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["support_ticket_messages", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to send reply.");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (adminId: string) => assignTicket(ticketId, { admin_id: adminId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
      toast.success("Ticket assigned.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign ticket.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => setTicketStatus(ticketId, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["support_ticket", ticketId], updated);
      toast.success(`Ticket marked ${updated.status.replace("_", " ").toLowerCase()}.`);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to update status.");
    },
  });

  const ticket = ticketQuery.data;

  if (ticketQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconSpinner className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  if (ticketQuery.isError || !ticket) {
    const notFound = ticketQuery.error instanceof ApiError && ticketQuery.error.status === 404;
    return (
      <EmptyState
        icon={IconLifeBuoy}
        title={notFound ? "Ticket not found" : "Failed to load ticket"}
        description={notFound ? "This ticket may have been removed." : "Something went wrong. Try refreshing the page."}
      />
    );
  }

  const closed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const isEscalated = !!ticket.escalated_at && !closed;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reply.trim();
    if (!trimmed || closed) return;
    sendMutation.mutate(trimmed);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/help-support/tickets")}
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors cursor-pointer"
        >
          &larr; Back to Tickets
        </button>
      </div>

      <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                {ticket.subject || `Ticket #${ticket.id.slice(0, 8)}`}
              </h1>
              <StatusBadge status={ticket.status} />
              {isEscalated && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                  <IconAlertTriangle className="w-3 h-3" />
                  Escalated
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {personName(ticket.user) || ticket.user_id}
              {ticket.user?.email ? ` · ${ticket.user.email}` : ""}
            </p>
            {ticket.rating && (
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                <IconStar />
                {ticket.rating}/5
                {ticket.rating_comment ? ` — "${ticket.rating_comment}"` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Assign</label>
              <select
                value={ticket.assigned_admin_id ?? ""}
                onChange={(e) => e.target.value && assignMutation.mutate(e.target.value)}
                disabled={assignMutation.isPending}
                className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                <option value="" disabled>
                  Unassigned
                </option>
                {adminsQuery.data?.data?.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {[admin.first_name, admin.last_name].filter(Boolean).join(" ") || admin.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => statusMutation.mutate(e.target.value as TicketStatus)}
                disabled={statusMutation.isPending}
                className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-3 p-6 max-h-[55vh] overflow-y-auto">
          {messagesQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <IconSpinner className="w-5 h-5 text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No messages yet.</p>
          ) : (
            messages.map((msg: TicketMessage) => {
              const isAdmin = msg.sender_type === "ADMIN";
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      isAdmin
                        ? "bg-[#2D6A4F] text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[0.65rem] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {isAdmin ? personName(msg.sender) || "Admin" : personName(msg.sender) || personName(ticket.user) || "User"} ·{" "}
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gray-100 dark:border-gray-800 p-4 flex items-end gap-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={closed}
            placeholder={closed ? "This ticket is closed — no further replies can be sent." : "Type your reply..."}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            className="flex-1 resize-none px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={closed || !reply.trim() || sendMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMutation.isPending ? <IconSpinner className="w-4 h-4" /> : <IconSend />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
