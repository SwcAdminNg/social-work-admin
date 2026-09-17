"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconSpinner } from "@/components/dashboard/icons";

type State = { status: "loading" } | { status: "error"; message: string };

export function GuestJoin() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "This link is missing its invite token." });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/live-session/guest-join?token=${encodeURIComponent(token)}`);
        const payload = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          const message =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message?: unknown }).message)
              : "This invite link is no longer valid.";
          setState({ status: "error", message });
          return;
        }

        const joinUrl = payload?.data?.join_url as string | undefined;
        if (!joinUrl) {
          setState({ status: "error", message: "This invite link is no longer valid." });
          return;
        }

        window.location.href = joinUrl;
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "Couldn't reach the server. Check your connection and try again." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-sm w-full text-center">
        {state.status === "loading" ? (
          <>
            <IconSpinner className="w-8 h-8 mx-auto text-[#2D6A4F] dark:text-[#52b788]" />
            <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              Joining the live session...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Can&apos;t join this session</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
