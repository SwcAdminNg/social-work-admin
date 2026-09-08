"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPageTitle } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { IconBell, IconLogout, IconMenu } from "./icons";
import { LogoutModal } from "./LogoutModal";
import { useNotificationSocket } from "@/lib/hooks/useNotificationSocket";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications-client";
import type { Notification, NotificationType } from "@/lib/api/notifications.types";

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

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { setMobileOpen } = useSidebar();
  const title = getPageTitle(pathname);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const token = session?.accessToken;
  const socketEnabled = Boolean(token) && !session?.error;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
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
    isLoading: notifLoading,
  } = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: ({ pageParam }) => getNotifications({ page: pageParam, page_size: NOTIF_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined),
    enabled: Boolean(token) && notifOpen,
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
    setNotifOpen(false);
    if (notification.link) router.push(notification.link);
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between gap-3 px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile sidebar trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          className="lg:hidden w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <IconMenu />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <IconBell />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#F4A261] ring-2 ring-white dark:ring-gray-900" />
            )}
          </button>

          <div
            className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl origin-top-right transition-all duration-150 ${
              notifOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Notifications
              </p>
              {unreadCount > 0 ? (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs font-medium text-[#2D6A4F] dark:text-[#52b788] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  Mark all read
                </button>
              ) : (
                <span className="text-xs font-medium text-gray-400 dark:text-gray-600">All caught up</span>
              )}
            </div>
            <ul className="list-none m-0 p-2 max-h-80 overflow-y-auto">
              {notifLoading && (
                <li className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-600">Loading…</li>
              )}
              {!notifLoading && notifications.length === 0 && (
                <li className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
                  No notifications yet.
                </li>
              )}
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors cursor-pointer ${
                      !n.is_read ? "bg-gray-50/80 dark:bg-gray-800/40" : ""
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#F4A261] flex-shrink-0" />}
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{n.body}</span>
                    )}
                    <span className="text-[0.7rem] text-gray-400 dark:text-gray-600 mt-0.5">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                </li>
              ))}
              {hasNextPage && (
                <li>
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full text-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          aria-label="Logout"
          title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <IconLogout />
        </button>
      </div>
    </header>

    <LogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
  </>
);
}
