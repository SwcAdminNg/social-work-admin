import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type {
  AssignTicketPayload,
  CreateFaqCategoryPayload,
  CreateFaqItemPayload,
  FaqCategory,
  FaqItem,
  GetTicketsParams,
  SetTicketStatusPayload,
  Ticket,
  TicketMessage,
  UpdateFaqCategoryPayload,
  UpdateFaqItemPayload,
} from "./support.types";

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

function toPaginated<T>(envelope: ApiEnvelope<T[]>, page = 1, pageSize = 20): PaginatedResult<T> {
  return {
    items: envelope.data ?? [],
    meta: envelope.meta ?? {
      page,
      page_size: pageSize,
      total_items: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// FAQ categories

export async function getFaqCategories(): Promise<FaqCategory[]> {
  const res = await request<ApiEnvelope<FaqCategory[]>>("/api/support/faq/categories");
  return res.data ?? [];
}

export async function createFaqCategory(payload: CreateFaqCategoryPayload): Promise<FaqCategory> {
  const res = await request<ApiEnvelope<FaqCategory>>("/api/support/faq/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFaqCategory(id: string, payload: UpdateFaqCategoryPayload): Promise<FaqCategory> {
  const res = await request<ApiEnvelope<FaqCategory>>(`/api/support/faq/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteFaqCategory(id: string): Promise<void> {
  await request(`/api/support/faq/categories/${id}`, { method: "DELETE" });
}

// FAQ items

export async function getFaqItems(page = 1, pageSize = 50): Promise<PaginatedResult<FaqItem>> {
  const res = await request<ApiEnvelope<FaqItem[]>>(
    `/api/support/faq/items${buildQuery({ page, page_size: pageSize })}`
  );
  return toPaginated(res, page, pageSize);
}

export async function createFaqItem(payload: CreateFaqItemPayload): Promise<FaqItem> {
  const res = await request<ApiEnvelope<FaqItem>>("/api/support/faq/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateFaqItem(id: string, payload: UpdateFaqItemPayload): Promise<FaqItem> {
  const res = await request<ApiEnvelope<FaqItem>>(`/api/support/faq/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteFaqItem(id: string): Promise<void> {
  await request(`/api/support/faq/items/${id}`, { method: "DELETE" });
}

// Tickets

export async function getTickets(params: GetTicketsParams = {}): Promise<PaginatedResult<Ticket>> {
  const res = await request<ApiEnvelope<Ticket[]>>(
    `/api/support/tickets${buildQuery({
      status: params.status,
      assigned_admin_id: params.assigned_admin_id,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    })}`
  );
  return toPaginated(res, params.page ?? 1, params.page_size ?? 20);
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await request<ApiEnvelope<Ticket>>(`/api/support/tickets/${id}`);
  return res.data;
}

export async function getTicketMessages(id: string, page = 1, pageSize = 50): Promise<PaginatedResult<TicketMessage>> {
  const res = await request<ApiEnvelope<TicketMessage[]>>(
    `/api/support/tickets/${id}/messages${buildQuery({ page, page_size: pageSize })}`
  );
  return toPaginated(res, page, pageSize);
}

export async function sendTicketMessage(id: string, message: string): Promise<TicketMessage> {
  const res = await request<ApiEnvelope<TicketMessage>>(`/api/support/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return res.data;
}

export async function assignTicket(id: string, payload: AssignTicketPayload): Promise<Ticket> {
  const res = await request<ApiEnvelope<Ticket>>(`/api/support/tickets/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function setTicketStatus(id: string, payload: SetTicketStatusPayload): Promise<Ticket> {
  const res = await request<ApiEnvelope<Ticket>>(`/api/support/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

// Presence

export async function sendPresenceHeartbeat(): Promise<void> {
  await request("/api/support/presence/heartbeat", { method: "POST" });
}
