import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { ContactMessage } from "./contact.types";

export interface ContactMessagesFilters {
  platform?: string;
  category?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export async function getContactMessages(
  page: number = 1,
  limit: number = 20,
  filters?: ContactMessagesFilters
): Promise<PaginatedResult<ContactMessage>> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));
  
  if (filters) {
    if (filters.platform) searchParams.set("platform", filters.platform);
    if (filters.category) searchParams.set("category", filters.category);
    if (filters.search) searchParams.set("search", filters.search);
    if (filters.start_date) searchParams.set("start_date", filters.start_date);
    if (filters.end_date) searchParams.set("end_date", filters.end_date);
  }
  
  const qs = searchParams.toString();
  
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
