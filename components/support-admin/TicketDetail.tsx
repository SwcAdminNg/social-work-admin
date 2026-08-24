"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  assignTicket,
  getAssignableStaff,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
  setTicketStatus,
  uploadTicketAttachment,
} from "@/lib/api/support-client";
import type { PaginatedResult } from "@/lib/api/courses.types";
import type { Ticket, TicketMessage, TicketStatus } from "@/lib/api/support.types";
import { StatusBadge } from "./TicketQueueList";
import { NotStaffNotice } from "./NotStaffNotice";
import { useTicketSocket } from "@/lib/hooks/useTicketSocket";
import {
  IconSend,
  IconSpinner,
  IconStar,
  IconAlertTriangle,
  IconUpload,
  IconX,
  IconDocument,
  IconWifi,
} from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconLifeBuoy } from "@/components/dashboard/icons";

const STATUS_OPTIONS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
// The WebSocket keeps this live — these are just a safety net for whenever it's down
// (reconnecting, or an event type it doesn't cover, e.g. a user-submitted rating).
const FALLBACK_MESSAGES_POLL_MS = 8_000;
const FALLBACK_TICKET_POLL_MS = 20_000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

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

function appendMessage(
  old: PaginatedResult<TicketMessage> | undefined,
  message: TicketMessage
): PaginatedResult<TicketMessage> | undefined {
  if (!old) return old;
  if (old.items.some((m) => m.id === message.id)) return old; // already have it (e.g. our own just-sent message)
  return { ...old, items: [...old.items, message] };
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.userType === "ADMIN";
  const currentUserId = session?.user?.id;
  const [reply, setReply] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ticketQuery = useQuery({
    queryKey: ["support_ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    retry: (failureCount, error) => error instanceof ApiError && error.status !== 403 && error.status !== 404 && failureCount < 2,
  });

  const messagesQuery = useQuery({
    queryKey: ["support_ticket_messages", ticketId],
    queryFn: () => getTicketMessages(ticketId, 1, 100),
    enabled: !ticketQuery.isError,
  });

  // Only an admin can enumerate the full staff roster (Users + Groups are admin-only
  // endpoints) — a non-admin staff member just gets an "Assign to me" quick action instead.
  const staffQuery = useQuery({
    queryKey: ["assignable_staff"],
    queryFn: getAssignableStaff,
    staleTime: 60_000,
    enabled: isAdmin && !ticketQuery.isError,
  });

  const { connected } = useTicketSocket({
    ticketId,
    token: session?.accessToken,
    enabled: !ticketQuery.isError,
    onMessage: (message) => {
      queryClient.setQueryData<PaginatedResult<TicketMessage>>(["support_ticket_messages", ticketId], (old) =>
        appendMessage(old, message)
      );
      // A new message can also flip status (OPEN -> IN_PROGRESS) and clear escalation.
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    },
    onAssigned: () => {
      // The event only carries the id, not the full embedded user — refetch for that.
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    },
    onStatusChanged: (status) => {
      queryClient.setQueryData<Ticket>(["support_ticket", ticketId], (old) => (old ? { ...old, status } : old));
    },
    onError: (detail) => toast.error(detail),
  });

  // Fallback polling only while the socket is down, so nothing goes stale silently.
  useEffect(() => {
    if (connected || ticketQuery.isError) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["support_ticket_messages", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    }, FALLBACK_MESSAGES_POLL_MS);
    return () => clearInterval(interval);
  }, [connected, ticketQuery.isError, ticketId, queryClient]);

  // Even while connected, refresh the ticket occasionally to pick up things the socket
  // doesn't push an event for, e.g. a user submitting a rating after resolution.
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    }, FALLBACK_TICKET_POLL_MS);
    return () => clearInterval(interval);
  }, [connected, ticketId, queryClient]);

  const messages = messagesQuery.data?.items ?? [];
  const prevCount = useRef(0);
  useEffect(() => {
    if (messages.length !== prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCount.current = messages.length;
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async ({ body, file }: { body: string; file: File | null }) => {
      let attachmentFields = {};
      if (file) {
        setUploading(true);
        try {
          attachmentFields = await uploadTicketAttachment(ticketId, file);
        } finally {
          setUploading(false);
        }
      }
      return sendTicketMessage(ticketId, { body, ...attachmentFields });
    },
    onSuccess: (message) => {
      setReply("");
      setAttachment(null);
      queryClient.setQueryData<PaginatedResult<TicketMessage>>(["support_ticket_messages", ticketId], (old) =>
        appendMessage(old, message)
      );
      queryClient.invalidateQueries({ queryKey: ["support_ticket", ticketId] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send reply.");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (staffId: string) => assignTicket(ticketId, { admin_id: staffId }),
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
    const status = ticketQuery.error instanceof ApiError ? ticketQuery.error.status : null;
    if (status === 403) return <NotStaffNotice />;
    return (
      <EmptyState
        icon={IconLifeBuoy}
        title={status === 404 ? "Ticket not found" : "Failed to load ticket"}
        description={status === 404 ? "This ticket may have been removed." : "Something went wrong. Try refreshing the page."}
      />
    );
  }

  const closed = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const isEscalated = !!ticket.escalated_at && !closed;
  const canSend = (reply.trim() || attachment) && !closed;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    sendMutation.mutate({ body: reply.trim(), file: attachment });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachments must be 10MB or smaller.");
      return;
    }
    setAttachment(file);
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
              {isAdmin ? (
                <select
                  value={ticket.assigned_admin_id ?? ""}
                  onChange={(e) => e.target.value && assignMutation.mutate(e.target.value)}
                  disabled={assignMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="" disabled>
                    Unassigned
                  </option>
                  {staffQuery.data?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.username}
                    </option>
                  ))}
                </select>
              ) : ticket.assigned_admin_id === currentUserId ? (
                <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">Assigned to you</span>
              ) : (
                <button
                  type="button"
                  onClick={() => currentUserId && assignMutation.mutate(currentUserId)}
                  disabled={assignMutation.isPending}
                  className="px-3 py-1.5 text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                >
                  Assign to me
                </button>
              )}
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
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Conversation</h2>
          <span
            className={`inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
              connected ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <IconWifi />
            {connected ? "Live" : "Reconnecting…"}
          </span>
        </div>
        <div className="flex flex-col gap-3 p-6 max-h-[55vh] overflow-y-auto">
          {messagesQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <IconSpinner className="w-5 h-5 text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No messages yet.</p>
          ) : (
            messages.map((msg: TicketMessage) => {
              const isAdminSender = msg.sender_type === "ADMIN";
              return (
                <div key={msg.id} className={`flex flex-col ${isAdminSender ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words flex flex-col gap-2 ${
                      isAdminSender
                        ? "bg-[#2D6A4F] text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.attachment_url && msg.attachment_kind === "IMAGE" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.attachment_url}
                        alt={msg.attachment_file_name ?? "Attachment"}
                        className="max-w-full max-h-64 rounded-lg object-contain"
                      />
                    )}
                    {msg.attachment_url && msg.attachment_kind === "DOCUMENT" && (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold underline underline-offset-2 ${
                          isAdminSender ? "bg-white/10" : "bg-white dark:bg-gray-900"
                        }`}
                      >
                        <IconDocument />
                        {msg.attachment_file_name ?? "Attachment"}
                      </a>
                    )}
                    {msg.body && <span>{msg.body}</span>}
                  </div>
                  <span className="text-[0.65rem] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {isAdminSender ? personName(msg.sender) || "Staff" : personName(msg.sender) || personName(ticket.user) || "User"} ·{" "}
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2">
          {attachment && (
            <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
              <IconDocument />
              <span className="truncate max-w-[220px]">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-gray-400 hover:text-red-500 cursor-pointer"
                aria-label="Remove attachment"
              >
                <IconX size={14} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={closed || uploading}
              title="Attach a file"
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <IconUpload />
            </button>
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
              disabled={!canSend || sendMutation.isPending || uploading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sendMutation.isPending || uploading ? <IconSpinner className="w-4 h-4" /> : <IconSend />}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
