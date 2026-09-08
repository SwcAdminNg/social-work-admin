import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { GetNotificationsParams, Notification, UnreadCount } from "./notifications.types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : undefined) ?? res.statusText;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getNotifications(
  params: GetNotificationsParams = {},
): Promise<PaginatedResult<Notification>> {
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const res = await request<ApiEnvelope<Notification[]>>(
    `/api/notifications${buildQuery({
      unread_only: params.unread_only,
      page,
      page_size: pageSize,
    })}`,
  );
  return {
    items: res.data ?? [],
    meta: res.meta ?? {
      page,
      page_size: pageSize,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await request<ApiEnvelope<UnreadCount | number>>("/api/notifications/unread-count");
  return typeof res.data === "number" ? res.data : (res.data?.count ?? 0);
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const res = await request<ApiEnvelope<Notification>>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await request(`/api/notifications/read-all`, { method: "POST" });
}
