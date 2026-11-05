"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Cloud, Fingerprint, Laptop, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { type AdminPasskey, describeBrowser, fetchPasskeys, revokePasskey } from "@/lib/api/passkeys";
import { IconSpinner } from "@/components/dashboard/icons";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { Pagination } from "@/components/generic/ui/Pagination";
import { EmptyState } from "@/components/dashboard/EmptyState";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const formatDate = (iso?: string | null) => (iso ? dateFormat.format(new Date(iso)) : null);
const ownerName = (p: AdminPasskey) => `${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() || p.user.username || p.user.email;

/** Every registered passkey, with its owner, device and usage, and a revoke action. */
export function PasskeysList({ initialData }: { initialData: PaginatedResult<AdminPasskey> }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(
    async (page: number, term = search) => {
      setLoading(true);
      try {
        setData(await fetchPasskeys(page, data.meta.page_size, { search: term.trim() || undefined }));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load passkeys.");
      } finally {
        setLoading(false);
      }
    },
    [data.meta.page_size, search],
  );

  const revoke = async (passkey: AdminPasskey) => {
    setRevoking(passkey.id);
    try {
      await revokePasskey(passkey.id);
      toast.success(`Revoked “${passkey.name}” for ${ownerName(passkey)}.`);
      setConfirmId(null);
      await load(data.items.length === 1 && data.meta.page > 1 ? data.meta.page - 1 : data.meta.page);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to revoke the passkey.");
    } finally {
      setRevoking(null);
    }
  };

  const columns: DataTableColumn<AdminPasskey>[] = [
    {
      key: "user",
      header: "User",
      hideInCard: true,
      render: (p) => (
        <Link href={`/dashboard/user-management/${p.user.id}`} className="block no-underline">
          <span className="block text-sm font-semibold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">{ownerName(p)}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">{p.user.email}</span>
        </Link>
      ),
    },
    {
      key: "device",
      header: "Passkey",
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {p.synced ? <Cloud className="h-4 w-4" aria-hidden="true" /> : <Laptop className="h-4 w-4" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[p.provider, p.synced ? "Synced" : "Single device"].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "site",
      header: "Site",
      render: (p) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{p.rp_id}</span>,
    },
    {
      key: "created",
      header: "Registered",
      render: (p) => (
        <div className="text-sm">
          <span className="block whitespace-nowrap text-slate-800 dark:text-slate-200" suppressHydrationWarning>{formatDate(p.created_at)}</span>
          {describeBrowser(p.created_user_agent) && <span className="block text-xs text-slate-500">{describeBrowser(p.created_user_agent)}</span>}
        </div>
      ),
    },
    {
      key: "used",
      header: "Last used",
      render: (p) =>
        p.last_used_at ? (
          <div className="text-sm">
            <span className="block whitespace-nowrap text-slate-800 dark:text-slate-200" suppressHydrationWarning>{formatDate(p.last_used_at)}</span>
            {describeBrowser(p.last_used_user_agent) && <span className="block text-xs text-slate-500">{describeBrowser(p.last_used_user_agent)}</span>}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Never</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Passkeys</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Devices people registered to sign in with a fingerprint, face or screen lock. Revoking a passkey stops it working
          immediately; the person can still sign in with their password.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(1);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end dark:border-ink-line dark:bg-ink-surface"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="passkey-search" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Search</label>
          <input
            id="passkey-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, username or device"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-400/15 dark:border-ink-line dark:bg-ink-page/60 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          {search && (
            <button type="button" onClick={() => { setSearch(""); load(1, ""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
              Clear
            </button>
          )}
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {loading && <IconSpinner className="h-4 w-4" />} Search
          </button>
        </div>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        {data.meta.total_items} {data.meta.total_items === 1 ? "passkey" : "passkeys"} registered
      </p>

      <div className={`transition-opacity duration-200 ${loading && data.items.length > 0 ? "opacity-60" : ""}`}>
        <DataTable
          columns={columns}
          data={data.items}
          keyExtractor={(p) => p.id}
          loading={loading && data.items.length === 0}
          skeletonRows={5}
          cardTitle={(p) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{ownerName(p)}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.user.email}</p>
            </div>
          )}
          actions={(p) =>
            confirmId === p.id ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => revoke(p)}
                  disabled={revoking === p.id}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  {revoking === p.id ? <IconSpinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />} Revoke
                </button>
                <button type="button" onClick={() => setConfirmId(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
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
            )
          }
          emptyState={
            <EmptyState
              icon={Fingerprint}
              title={search ? "No passkeys match your search" : "No passkeys registered yet"}
              description={search ? "Try a different name, email or device." : "Passkeys appear here once people add one in their account settings."}
            />
          }
        />
      </div>

      {data.meta.total_pages > 1 && (
        <Pagination currentPage={data.meta.page} totalPages={data.meta.total_pages} onPageChange={(p) => load(p)} />
      )}
    </div>
  );
}
