"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck, Loader2, RefreshCcw } from "lucide-react";
import { useNotificationSocket } from "@/lib/hooks/useNotificationSocket";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications-client";
import type { Notification, NotificationType } from "@/lib/api/notifications.types";
import { badgeLabel } from "@/components/community-admin/UnreadBadge";

const NOTIF_PAGE_SIZE = 15;

// The queue-item types worth a toast — the account-level/self types (LOGIN, ROLE_CHANGED, etc.)
// just land quietly in the feed like on the student side.
const TOAST_TYPES = new Set<NotificationType>([
  "NEW_USER_SIGNUP",
  "NEW_PAYMENT",
  "NEW_CONTACT_MESSAGE",
  "NEW_SUPPORT_TICKET",
  "NEW_COURSE_REVIEW",
  "ADMIN_INVITE_ACCEPTED",
  "SUPPORT_TICKET_ASSIGNED",
  "SUPPORT_TICKET_MESSAGE",
]);

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ICON_BUTTON =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-500 transition hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-brand-400/12 dark:hover:text-brand-200";

export function NotificationCenter() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const token = session?.accessToken;
  const socketEnabled = Boolean(token) && !session?.error;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(token),
    refetchInterval: 60_000,
  });

  const {
    data: notifPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam }) => getNotifications({ page: pageParam, page_size: NOTIF_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined),
    enabled: Boolean(token) && open,
  });
  const notifications = notifPages?.pages.flatMap((p) => p.items) ?? [];

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      queryClient.setQueryData(["notifications", "list"], (old: typeof notifPages) => {
        if (!old) return old;
        return {
          ...old,
          pages: [{ ...old.pages[0], items: [notification, ...old.pages[0].items] }, ...old.pages.slice(1)],
        };
      });
      queryClient.setQueryData(["notifications", "unread-count"], (old: number = 0) => old + 1);

      if (TOAST_TYPES.has(notification.type)) {
        toast(notification.title, {
          description: notification.body ?? undefined,
          action: notification.link
            ? { label: "View", onClick: () => router.push(notification.link as string) }
            : undefined,
        });
      }
    },
    [queryClient, router],
  );

  useNotificationSocket({ token, enabled: socketEnabled, onNotification: handleNewNotification });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData(["notifications", "list"], (old: typeof notifPages) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) => (n.id === updated.id ? updated : n)),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(["notifications", "list"], (old: typeof notifPages) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) => ({ ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() })),
          })),
        };
      });
      queryClient.setQueryData(["notifications", "unread-count"], 0);
    },
  });

  function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) markReadMutation.mutate(notification.id);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-400/12 dark:hover:text-brand-200"
      >
        <Bell className="h-5 w-5" strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white dark:ring-ink-surface">
            {badgeLabel(unreadCount)}
          </span>
        )}
      </button>

      <div
        hidden={!open}
        className={`absolute right-0 z-50 mt-2 w-[23rem] max-w-[calc(100vw-2rem)] origin-top-right rounded-lg border border-[#e5e3ee] bg-white shadow-xl transition-all duration-150 dark:border-ink-line dark:bg-ink-surface ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eceaf4] px-4 py-3 dark:border-ink-line">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={ICON_BUTTON}
              aria-label="Refresh notifications"
              title="Refresh"
            >
              <RefreshCcw className={`h-4 w-4 ${isFetching && !isFetchingNextPage ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              className={ICON_BUTTON}
              aria-label="Mark all as read"
              title="Mark all as read"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Nothing new yet</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Signups, payments, tickets and other platform activity will appear here.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className="flex w-full cursor-pointer gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[#f7fcf9] dark:hover:bg-brand-400/12"
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.is_read ? "bg-slate-300 dark:bg-slate-700" : "bg-brand-600 dark:bg-brand-300"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-950 dark:text-slate-100">{n.title}</span>
                      {n.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[0.7rem] font-medium text-slate-400 dark:text-slate-500">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-bold text-slate-600 transition hover:border-brand-600/50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-line dark:text-slate-300 dark:hover:border-brand-300 dark:hover:text-brand-300"
            >
              {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
