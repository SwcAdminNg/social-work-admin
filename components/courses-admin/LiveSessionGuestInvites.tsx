"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getLiveSessionGuests, inviteLiveSessionGuests, revokeLiveSessionGuest } from "@/lib/api/courses-client";
import type { LiveSessionGuestInvite, LiveSessionStatus } from "@/lib/api/courses.types";
import { IconChevronDown, IconPlus, IconSpinner, IconTrash, IconUserPlus } from "@/components/dashboard/icons";
import { ConfirmDialog } from "./ConfirmDialog";

type InviteRow = { email: string; name: string };

function emptyRow(): InviteRow {
  return { email: "", name: "" };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LiveSessionGuestInvites({
  itemId,
  status,
}: {
  itemId: string;
  status: LiveSessionStatus;
}) {
  const canInvite = status !== "ENDED" && status !== "CANCELLED";

  const [expanded, setExpanded] = useState(false);
  const [guests, setGuests] = useState<LiveSessionGuestInvite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [rows, setRows] = useState<InviteRow[]>([emptyRow()]);
  const [revokeTarget, setRevokeTarget] = useState<LiveSessionGuestInvite | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!expanded || guests !== null) return;
    setLoading(true);
    getLiveSessionGuests(itemId)
      .then(setGuests)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load guest invites."))
      .finally(() => setLoading(false));
  }, [expanded, guests, itemId]);

  function updateRow(index: number, field: keyof InviteRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const invites = rows
      .map((r) => ({ email: r.email.trim(), name: r.name.trim() || undefined }))
      .filter((r) => r.email);
    if (invites.length === 0) return;

    setInviting(true);
    try {
      const created = await inviteLiveSessionGuests(itemId, { invites });
      setGuests((prev) => {
        const byId = new Map((prev ?? []).map((g) => [g.id, g]));
        for (const invite of created) byId.set(invite.id, invite);
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });
      setRows([emptyRow()]);
      toast.success(invites.length > 1 ? "Guest invites sent." : "Guest invite sent.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send guest invites.");
    } finally {
      setInviting(false);
    }
  }

  function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    revokeLiveSessionGuest(itemId, revokeTarget.id)
      .then(() => {
        setGuests((prev) =>
          (prev ?? []).map((g) =>
            g.id === revokeTarget.id ? { ...g, revoked_at: new Date().toISOString() } : g,
          ),
        );
        toast.success("Invite revoked.");
        setRevokeTarget(null);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to revoke invite."))
      .finally(() => setRevoking(false));
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]";

  return (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left cursor-pointer py-1"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <IconUserPlus className="w-4 h-4" />
          Guest invites
          {guests && guests.length > 0 && (
            <span className="text-gray-400 dark:text-gray-600">({guests.length})</span>
          )}
        </span>
        <IconChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {!canInvite && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-2">
              This session has {status.toLowerCase()} — no new guests can be invited.
            </div>
          )}

          {canInvite && (
            <form onSubmit={handleInvite} className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={row.email}
                    onChange={(e) => updateRow(i, "email", e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="text"
                    placeholder="Name (optional)"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                    aria-label="Remove row"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRows((prev) => [...prev, emptyRow()])}
                  disabled={rows.length >= 100}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <IconPlus />
                  Add another
                </button>
                <button
                  type="submit"
                  disabled={inviting || rows.every((r) => !r.email.trim())}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {inviting && <IconSpinner className="w-3.5 h-3.5" />}
                  Send invite{rows.filter((r) => r.email.trim()).length > 1 ? "s" : ""}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1.5">
            {loading && (
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <IconSpinner className="w-3.5 h-3.5" /> Loading invites...
              </p>
            )}
            {!loading && guests && guests.length === 0 && (
              <p className="text-xs text-gray-400">No guests invited yet.</p>
            )}
            {!loading &&
              guests?.map((guest) => {
                const revoked = !!guest.revoked_at;
                return (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {guest.name || guest.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {guest.name ? `${guest.email} · ` : ""}
                        {revoked
                          ? "Revoked"
                          : guest.join_count > 0
                            ? `Joined ${guest.join_count}x · last ${formatDate(guest.last_joined_at!)}`
                            : "Not joined yet"}
                      </p>
                    </div>
                    {!revoked && (
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(guest)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex-shrink-0"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke this invite?"
        description={`${revokeTarget?.name || revokeTarget?.email} will no longer be able to join using their emailed link. This doesn't un-send the original email.`}
        confirmLabel="Revoke"
        loading={revoking}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}
