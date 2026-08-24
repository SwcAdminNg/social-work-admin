"use client";

import { useEffect, useRef, useState } from "react";
import type { TicketMessage, TicketStatus } from "@/lib/api/support.types";

function wsBaseUrl(): string {
  const httpBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  return httpBase.replace(/^http/, "ws");
}

type TicketSocketEvent =
  | { type: "message"; data: TicketMessage }
  | { type: "assigned"; admin_id: string }
  | { type: "status_changed"; status: TicketStatus }
  | { type: "error"; detail: string };

interface UseTicketSocketOptions {
  ticketId: string;
  token: string | undefined;
  enabled: boolean;
  onMessage: (message: TicketMessage) => void;
  onAssigned: (adminId: string) => void;
  onStatusChanged: (status: TicketStatus) => void;
  onError?: (detail: string) => void;
}

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 15_000;
const PING_INTERVAL_MS = 25_000;

/**
 * Live push channel for a ticket's chat — replaces polling the messages/ticket endpoints.
 * Receive-only by design: sending still goes over HTTP (see support-client.ts), since that
 * path returns the created message directly and works even where Redis (which fans the WS
 * broadcast out) isn't configured, e.g. local dev — see HELP_SUPPORT_ADMIN_API.md.
 */
export function useTicketSocket({
  ticketId,
  token,
  enabled,
  onMessage,
  onAssigned,
  onStatusChanged,
  onError,
}: UseTicketSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closedByUsRef = useRef(false);
  // Keep the latest callbacks in a ref so a parent re-render (new callback identities)
  // doesn't tear down and reopen the socket.
  const handlersRef = useRef({ onMessage, onAssigned, onStatusChanged, onError });
  useEffect(() => {
    handlersRef.current = { onMessage, onAssigned, onStatusChanged, onError };
  }, [onMessage, onAssigned, onStatusChanged, onError]);

  useEffect(() => {
    if (!enabled || !token) {
      setConnected(false);
      return;
    }
    closedByUsRef.current = false;
    attemptRef.current = 0;

    let pingInterval: ReturnType<typeof setInterval> | undefined;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const url = `${wsBaseUrl()}/support/tickets/${ticketId}/ws?token=${encodeURIComponent(token as string)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
        pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        let payload: TicketSocketEvent;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        const handlers = handlersRef.current;
        if (payload.type === "message") handlers.onMessage(payload.data);
        else if (payload.type === "assigned") handlers.onAssigned(payload.admin_id);
        else if (payload.type === "status_changed") handlers.onStatusChanged(payload.status);
        else if (payload.type === "error") handlers.onError?.(payload.detail);
      };

      socket.onclose = () => {
        setConnected(false);
        if (pingInterval) clearInterval(pingInterval);
        if (closedByUsRef.current) return;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** attemptRef.current, RECONNECT_MAX_MS);
        attemptRef.current += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      closedByUsRef.current = true;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socketRef.current?.close(1000);
      socketRef.current = null;
    };
  }, [ticketId, token, enabled]);

  return { connected };
}
