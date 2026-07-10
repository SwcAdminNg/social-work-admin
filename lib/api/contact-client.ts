import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { ContactMessage } from "./contact.types";

export async function getContactMessages(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<ContactMessage>> {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));
  const qs = search.toString();
  
  const res = await fetch(`/api/contact?${qs}`);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;
  
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, payload);
  }
  
  const envelope = payload as ApiEnvelope<ContactMessage[]>;
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
