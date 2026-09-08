"use client";

import { useEffect, useRef, useState } from "react";
import type { Notification, NotificationSocketEvent } from "@/lib/api/notifications.types";

function wsBaseUrl(): string {
  const httpBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  return httpBase.replace(/^http/, "ws");
}

interface UseNotificationSocketOptions {
  token: string | undefined;
  enabled: boolean;
  onNotification: (notification: Notification) => void;
}

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 15_000;
const PING_INTERVAL_MS = 25_000;

/**
 * Live push channel for the admin's notification feed — same protocol as useTicketSocket.
 * Receive-only: reads/mark-read still go over HTTP via notifications-client.ts.
 */
export function useNotificationSocket({ token, enabled, onNotification }: UseNotificationSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closedByUsRef = useRef(false);
  const handlersRef = useRef({ onNotification });
  useEffect(() => {
    handlersRef.current = { onNotification };
  }, [onNotification]);

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
      const url = `${wsBaseUrl()}/notifications/ws?token=${encodeURIComponent(token as string)}`;
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
        let payload: NotificationSocketEvent;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        if (payload.type === "notification") handlersRef.current.onNotification(payload.data);
      };

      socket.onclose = (event) => {
        setConnected(false);
        if (pingInterval) clearInterval(pingInterval);
        if (closedByUsRef.current || event.code === 4401) return;
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
  }, [token, enabled]);

  return { connected };
}
