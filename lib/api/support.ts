import { apiClient, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type {
  FaqCategory,
  FaqItem,
  GetTicketsParams,
  Ticket,
  TicketMessage,
} from "./support.types";

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getFaqCategories(token: string): Promise<FaqCategory[]> {
  const res = await apiClient.get<ApiEnvelope<FaqCategory[]>>("/support/faq/categories", { token });
  return res.data ?? [];
}

export async function getFaqItems(
  params: { page?: number; page_size?: number },
  token: string
): Promise<PaginatedResult<FaqItem>> {
  const res = await apiClient.get<ApiEnvelope<FaqItem[]>>(`/support/faq/items${buildQuery(params)}`, { token });
  return {
    items: res.data ?? [],
    meta: res.meta ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}

export async function getTickets(
  params: GetTicketsParams,
  token: string
): Promise<PaginatedResult<Ticket>> {
  const res = await apiClient.get<ApiEnvelope<Ticket[]>>(`/support/tickets${buildQuery(params)}`, { token });
  return {
    items: res.data ?? [],
    meta: res.meta ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}

export async function getTicket(id: string, token: string): Promise<Ticket> {
  const res = await apiClient.get<ApiEnvelope<Ticket>>(`/support/tickets/${id}`, { token });
  return res.data;
}

export async function getTicketMessages(
  id: string,
  params: { page?: number; page_size?: number },
  token: string
): Promise<PaginatedResult<TicketMessage>> {
  const res = await apiClient.get<ApiEnvelope<TicketMessage[]>>(
    `/support/tickets/${id}/messages${buildQuery(params)}`,
    { token }
  );
  return {
    items: res.data ?? [],
    meta: res.meta ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 50,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}
