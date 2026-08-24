"use client";

import { useEffect } from "react";
import { sendPresenceHeartbeat } from "@/lib/api/support-client";

const HEARTBEAT_INTERVAL_MS = 30_000;

/** Keeps the current admin marked "online" for Support Desk escalation while this view is mounted. */
export function usePresenceHeartbeat(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    sendPresenceHeartbeat().catch(() => {});
    const interval = setInterval(() => {
      sendPresenceHeartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled]);
}
