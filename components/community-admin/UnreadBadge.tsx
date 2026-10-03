"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCommunityCount } from "@/lib/api/community-client";

const POLL_INTERVAL_MS = 30_000;

/** Aggregate unread community-message count (GET /community/unread-count). */
export function useCommunityUnreadCount() {
  const { status } = useSession();
  const { data } = useQuery({
    queryKey: ["community_unread_count"],
    queryFn: getUnreadCommunityCount,
    enabled: status === "authenticated",
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });
  return data ?? 0;
}

export function badgeLabel(count: number) {
  return count > 99 ? "99+" : String(count);
}

/** Unread-message badge for the Communities nav item. */
export function UnreadBadge({ className = "" }: { className?: string }) {
  const count = useCommunityUnreadCount();
  if (!count) return null;

  return (
    <span
      className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold leading-none text-white ${className}`}
    >
      {badgeLabel(count)}
    </span>
  );
}
