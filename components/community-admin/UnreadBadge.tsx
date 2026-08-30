"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCommunityCount } from "@/lib/api/community-client";

const POLL_INTERVAL_MS = 30_000;

/** Aggregate unread-message badge for the Communities nav item (GET /community/unread-count). */
export function UnreadBadge() {
  const { status } = useSession();
  const { data } = useQuery({
    queryKey: ["community_unread_count"],
    queryFn: getUnreadCommunityCount,
    enabled: status === "authenticated",
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS,
  });

  if (!data) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[0.65rem] font-bold bg-red-500 text-white">
      {data > 99 ? "99+" : data}
    </span>
  );
}
