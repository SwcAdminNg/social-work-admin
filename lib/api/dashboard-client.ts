import { ApiError, ApiEnvelope } from "./client";
import type { AdminDashboardOverview } from "./dashboard.types";

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

export async function getAdminDashboardOverview(limit = 5): Promise<AdminDashboardOverview> {
  const res = await request<ApiEnvelope<AdminDashboardOverview>>(
    `/api/admin/dashboard/overview?limit=${limit}`,
  );
  return res.data;
}
