"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  getCommunityMessages,
  markCommunityRead,
  sendCommunityMessage,
  uploadCommunityAttachment,
} from "@/lib/api/community-client";
import type { CommunityMessage, PaginatedResult } from "@/lib/api/community.types";
import type { Resource } from "@/lib/api/resources.types";
import { useCommunitySocket } from "@/lib/hooks/useCommunitySocket";
import {
  IconAlertTriangle,
  IconDocument,
  IconLibrary,
  IconReply,
  IconSend,
  IconSpinner,
  IconUpload,
  IconUsers,
  IconWifi,
  IconX,
} from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Avatar, displayName } from "./Avatar";
import { ResourcePicker } from "./ResourcePicker";

const FALLBACK_POLL_MS = 8_000;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function appendMessage(
  old: PaginatedResult<CommunityMessage> | undefined,
  message: CommunityMessage,
): PaginatedResult<CommunityMessage> | undefined {
  if (!old) return old;
  if (old.items.some((m) => m.id === message.id)) return old;
  return { ...old, items: [...old.items, message] };
}

export function CommunityChatPanel({
  communityId,
  communityName,
  courseId,
  memberCount,
  onlineCount,
  onOpenMembers,
}: {
  communityId: string;
  communityName: string;
  courseId?: string | null;
  memberCount?: number;
  onlineCount?: number;
  onOpenMembers?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [sharedResource, setSharedResource] = useState<Resource | null>(null);
  const [resourcePickerOpen, setResourcePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: ["community_messages", communityId],
    queryFn: () => getCommunityMessages(communityId, 1, 50),
  });

  // Viewing a room counts as reading it — mark it read on open and again as new messages
  // arrive while it stays open, so the sidebar's unread badge stays accurate.
  function markRead() {
    markCommunityRead(communityId)
      .then(() => queryClient.invalidateQueries({ queryKey: ["community_unread_count"] }))
      .catch(() => {});
  }

  useEffect(() => {
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  const { connected } = useCommunitySocket({
    communityId,
    token: session?.accessToken,
    enabled: true,
    onMessage: (message) => {
      queryClient.setQueryData<PaginatedResult<CommunityMessage>>(["community_messages", communityId], (old) =>
        appendMessage(old, message),
      );
      markRead();
    },
    onError: (detail) => toast.error(detail),
  });

  useEffect(() => {
    if (connected) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["community_messages", communityId] });
    }, FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [connected, communityId, queryClient]);

  const messages = messagesQuery.data?.items ?? [];
  const prevCount = useRef(0);
  useEffect(() => {
    if (messages.length !== prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      prevCount.current = messages.length;
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      let attachmentFields = {};
      if (attachment) {
        setUploading(true);
        try {
          attachmentFields = await uploadCommunityAttachment(communityId, attachment);
        } finally {
          setUploading(false);
        }
      }
      return sendCommunityMessage(communityId, {
        body: body.trim() || undefined,
        reply_to_message_id: replyTo?.id ?? undefined,
        resource_reference_id: sharedResource?.id ?? undefined,
        ...attachmentFields,
      });
    },
    onSuccess: (message) => {
      setBody("");
      setAttachment(null);
      setReplyTo(null);
      setSharedResource(null);
      queryClient.setQueryData<PaginatedResult<CommunityMessage>>(["community_messages", communityId], (old) =>
        appendMessage(old, message),
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError || err instanceof Error ? err.message : "Failed to send message.");
    },
  });

  const canSend = (body.trim() || attachment || sharedResource) && !sendMutation.isPending && !uploading;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    sendMutation.mutate();
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{communityName}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {memberCount !== undefined && (
              <button
                type="button"
                onClick={onOpenMembers}
                disabled={!onOpenMembers}
                className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] disabled:hover:text-gray-500 cursor-pointer disabled:cursor-default"
              >
                <IconUsers />
                {memberCount} member{memberCount === 1 ? "" : "s"}
                {onlineCount !== undefined && onlineCount > 0 ? ` · ${onlineCount} online` : ""}
              </button>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider shrink-0 ${
            connected ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          <IconWifi />
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
        {messagesQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <IconSpinner className="w-5 h-5 text-gray-400" />
          </div>
        ) : messagesQuery.isError ? (
          <EmptyState icon={IconAlertTriangle} title="Failed to load messages" description="Something went wrong. Try refreshing." />
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No messages yet — say hello!</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?.id === currentUserId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && <Avatar user={msg.sender} size="sm" />}
                <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[0.65rem] font-semibold text-gray-400 dark:text-gray-500 px-1 mb-0.5">
                      {displayName(msg.sender)}
                    </span>
                  )}
                  <div
                    className={`group relative rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words flex flex-col gap-2 ${
                      isOwn
                        ? "bg-[#2D6A4F] text-white rounded-br-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {msg.reply_to && (
                      <div
                        className={`text-xs rounded-lg px-2.5 py-1.5 border-l-2 ${
                          isOwn ? "bg-white/10 border-white/40" : "bg-black/5 dark:bg-white/5 border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <p className="font-semibold opacity-80">{displayName(msg.reply_to.sender)}</p>
                        <p className="opacity-70 truncate">{msg.reply_to.body || "Attachment"}</p>
                      </div>
                    )}
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
                          isOwn ? "bg-white/10" : "bg-white dark:bg-gray-900"
                        }`}
                      >
                        <IconDocument />
                        {msg.attachment_file_name ?? "Attachment"}
                      </a>
                    )}
                    {msg.resource_reference && (
                      <a
                        href={`/dashboard/resource-management/${msg.resource_reference.id}`}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold underline underline-offset-2 ${
                          isOwn ? "bg-white/10" : "bg-white dark:bg-gray-900"
                        }`}
                      >
                        <IconLibrary />
                        {msg.resource_reference.name ?? "Shared resource"}
                      </a>
                    )}
                    {msg.body && <span>{msg.body}</span>}

                    <button
                      type="button"
                      onClick={() => setReplyTo(msg)}
                      title="Reply"
                      className={`absolute -top-2.5 ${isOwn ? "-left-2.5" : "-right-2.5"} w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hidden sm:flex`}
                    >
                      <IconReply />
                    </button>
                  </div>
                  <span className="text-[0.65rem] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {formatTimestamp(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2 shrink-0">
        {replyTo && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                Replying to {displayName(replyTo.sender)}
              </span>
              <p className="text-gray-400 dark:text-gray-500 truncate">{replyTo.body || "Attachment"}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
              aria-label="Cancel reply"
            >
              <IconX size={14} />
            </button>
          </div>
        )}
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
        {sharedResource && (
          <div className="flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
            <IconLibrary />
            <span className="truncate max-w-[220px]">{sharedResource.name}</span>
            <button
              type="button"
              onClick={() => setSharedResource(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
              aria-label="Remove shared resource"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach a file"
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
          >
            <IconUpload />
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setResourcePickerOpen((v) => !v)}
              title="Share a resource"
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <IconLibrary />
            </button>
            {resourcePickerOpen && (
              <ResourcePicker
                courseId={courseId}
                onClose={() => setResourcePickerOpen(false)}
                onPick={(resource) => {
                  setSharedResource(resource);
                  setResourcePickerOpen(false);
                }}
              />
            )}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            className="flex-1 resize-none px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sendMutation.isPending || uploading ? <IconSpinner className="w-4 h-4" /> : <IconSend />}
          </button>
        </div>
      </form>
    </div>
  );
}
