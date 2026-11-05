import { ApiError, apiClient, type ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";

export interface AdminPasskey {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string | null;
  device_type?: string | null;
  backed_up?: boolean;
  synced?: boolean;
  provider?: string | null;
  transports?: string[] | null;
  aaguid?: string | null;
  rp_id: string;
  created_user_agent?: string | null;
  last_used_user_agent?: string | null;
  user: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    username?: string | null;
  };
}

export interface PasskeyFilters {
  search?: string;
  user_id?: string;
}

function toResult(envelope: ApiEnvelope<AdminPasskey[]>, page: number, limit: number): PaginatedResult<AdminPasskey> {
  return {
    items: envelope.data ?? [],
    meta: {
      page: envelope.meta?.page ?? page,
      page_size: envelope.meta?.page_size ?? limit,
      total_items: envelope.meta?.total_items ?? 0,
      total_pages: envelope.meta?.total_pages ?? 1,
      has_next: envelope.meta?.has_next ?? false,
      has_previous: envelope.meta?.has_previous ?? false,
    },
  };
}

function query(page: number, limit: number, filters?: PasskeyFilters) {
  const params = new URLSearchParams({ page: String(page), page_size: String(limit) });
  if (filters?.search) params.set("search", filters.search);
  if (filters?.user_id) params.set("user_id", filters.user_id);
  return params.toString();
}

/** Server-side: first page for the Passkeys screen. */
export async function getPasskeys(page = 1, limit = 20, token?: string, filters?: PasskeyFilters) {
  const envelope = await apiClient.get<ApiEnvelope<AdminPasskey[]>>(`/admin/passkeys?${query(page, limit, filters)}`, token ? { token } : undefined);
  return toResult(envelope, page, limit);
}

async function browserFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((payload as { message?: string } | null)?.message || res.statusText, res.status, payload);
  }
  return payload as T;
}

/** Browser: list passkeys through the admin proxy. */
export async function fetchPasskeys(page = 1, limit = 20, filters?: PasskeyFilters) {
  const envelope = await browserFetch<ApiEnvelope<AdminPasskey[]>>(`/api/passkeys?${query(page, limit, filters)}`);
  return toResult(envelope, page, limit);
}

/** Browser: revoke a passkey so it can no longer be used to sign in. */
export function revokePasskey(id: string) {
  return browserFetch(`/api/passkeys/${id}`, { method: "DELETE" });
}

export function describeBrowser(userAgent?: string | null) {
  if (!userAgent) return null;
  const browser = /Edg\//.test(userAgent) ? "Edge" : /SamsungBrowser/.test(userAgent) ? "Samsung Internet" : /Firefox\/|FxiOS/.test(userAgent) ? "Firefox" : /Chrome\/|CriOS/.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : null;
  const system = /iPhone/.test(userAgent) ? "iPhone" : /iPad/.test(userAgent) ? "iPad" : /Android/.test(userAgent) ? "Android" : /Windows/.test(userAgent) ? "Windows" : /Mac OS X|Macintosh/.test(userAgent) ? "Mac" : /Linux/.test(userAgent) ? "Linux" : null;
  return [browser, system].filter(Boolean).join(" on ") || null;
}
