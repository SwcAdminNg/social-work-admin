"use client";

import { useEffect, useRef, useState } from "react";
import type { CommunityMessage } from "@/lib/api/community.types";

function wsBaseUrl(): string {
  const httpBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  return httpBase.replace(/^http/, "ws");
}

interface UseCommunitySocketOptions {
  communityId: string;
  token: string | undefined;
  enabled: boolean;
  onMessage: (message: CommunityMessage) => void;
  onTyping?: (userId: string) => void;
  onPresence?: (userId: string, isOnline: boolean) => void;
  onError?: (detail: string) => void;
}

const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 15_000;
const PING_INTERVAL_MS = 25_000;

/**
 * Live push channel for a community's chat, mirroring useTicketSocket.ts. Receive-only:
 * sending still goes over HTTP (see community-client.ts). The exact event shape from the
 * backend isn't documented for this client, so unrecognized `type` values are ignored rather
 * than treated as errors.
 */
export function useCommunitySocket({
  communityId,
  token,
  enabled,
  onMessage,
  onTyping,
  onPresence,
  onError,
}: UseCommunitySocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closedByUsRef = useRef(false);
  const handlersRef = useRef({ onMessage, onTyping, onPresence, onError });
  useEffect(() => {
    handlersRef.current = { onMessage, onTyping, onPresence, onError };
  }, [onMessage, onTyping, onPresence, onError]);

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
      const url = `${wsBaseUrl()}/community/${communityId}/ws?token=${encodeURIComponent(token as string)}`;
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
        let payload: { type?: string; data?: CommunityMessage; user_id?: string; is_online?: boolean; detail?: string };
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        const handlers = handlersRef.current;
        switch (payload.type) {
          case "message":
            if (payload.data) handlers.onMessage(payload.data);
            break;
          case "typing":
            if (payload.user_id) handlers.onTyping?.(payload.user_id);
            break;
          case "presence":
            if (payload.user_id) handlers.onPresence?.(payload.user_id, Boolean(payload.is_online));
            break;
          case "error":
            if (payload.detail) handlers.onError?.(payload.detail);
            break;
          default:
            break;
        }
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
  }, [communityId, token, enabled]);

  return { connected };
}
