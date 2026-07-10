import { apiClient, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { ContactMessage } from "./contact.types";

export async function getContactMessages(
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<PaginatedResult<ContactMessage>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();
  
  const res = await apiClient.get<ApiEnvelope<ContactMessage[]>>(`/contact-us?${query}`, token ? { token } : undefined);
  
  return {
    items: res.data ?? [],
    meta: {
      page: res.meta?.page ?? page,
      page_size: res.meta?.page_size ?? limit,
      total_items: res.meta?.total_items ?? 0,
      total_pages: res.meta?.total_pages ?? 1,
      has_next: res.meta?.has_next ?? false,
      has_previous: res.meta?.has_previous ?? false,
    },
  };
}
