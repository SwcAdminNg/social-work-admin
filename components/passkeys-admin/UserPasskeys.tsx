"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Cloud, Fingerprint, Laptop } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { describeBrowser, fetchPasskeys, revokePasskey } from "@/lib/api/passkeys";
import { IconSpinner } from "@/components/dashboard/icons";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The passkeys a single user has registered, shown on their profile. */
export function UserPasskeys({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { data, isPending, isError } = useQuery({
    queryKey: ["user-passkeys", userId],
    queryFn: () => fetchPasskeys(1, 50, { user_id: userId }),
    retry: false,
  });

  const revoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokePasskey(id);
      toast.success("Passkey revoked.");
      setConfirmId(null);
      await queryClient.invalidateQueries({ queryKey: ["user-passkeys", userId] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to revoke the passkey.");
    } finally {
      setRevoking(null);
    }
  };

  const passkeys = data?.items ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-ink-line dark:bg-ink-surface" aria-labelledby="user-passkeys-heading">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Fingerprint className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="user-passkeys-heading" className="font-display text-base font-bold text-slate-900 dark:text-white">Passkeys</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Devices this person uses to sign in with a fingerprint, face or screen lock.</p>
        </div>
      </div>

      {isPending ? (
        <div className="flex h-16 items-center justify-center"><IconSpinner className="h-5 w-5" /></div>
      ) : isError ? (
        <p className="text-sm text-red-600 dark:text-red-400">Could not load passkeys.</p>
      ) : passkeys.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No passkeys registered. This person signs in with their password and 2FA.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-ink-line">
          {passkeys.map((p) => {
            const lastBrowser = describeBrowser(p.last_used_user_agent);
            const details = [
              p.provider,
              p.synced ? "Synced" : "Single device",
              p.rp_id,
              `Added ${dateFormat.format(new Date(p.created_at))}`,
              p.last_used_at
                ? `Last used ${dateFormat.format(new Date(p.last_used_at))}${lastBrowser ? ` on ${lastBrowser}` : ""}`
                : "Never used",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {p.synced ? <Cloud className="h-4 w-4" aria-hidden="true" /> : <Laptop className="h-4 w-4" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>{details}</p>
                </div>
                {confirmId === p.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => revoke(p.id)}
                      disabled={revoking === p.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      {revoking === p.id && <IconSpinner className="h-3.5 w-3.5" />} Revoke
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(p.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    Revoke
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
