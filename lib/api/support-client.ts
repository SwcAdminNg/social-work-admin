import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import { getGroupMembers, getGroups } from "./groups-client";
import { getUsers } from "./users";
import type { User } from "./users.types";
import type {
  AssignTicketPayload,
  CreateFaqCategoryPayload,
  CreateFaqItemPayload,
  FaqCategory,
  FaqCategoryWithItems,
  FaqItem,
  GetTicketsParams,
  SendTicketMessagePayload,
  SetTicketStatusPayload,
  Ticket,
  TicketMessage,
  UpdateFaqCategoryPayload,
  UpdateFaqItemPayload,
  UploadAttachmentRequestPayload,
  UploadAttachmentResponse,
} from "./support.types";

const SUPPORT_DESK_GROUP_NAME = "Support Desk";

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
//
// There is no admin list-categories endpoint — categories are only enumerable via the
// public GET /support/faq, which nests each category with its *published* items. We only
// use it here for the {id, name, order} shell; item data comes from getFaqItems instead.

export async function getFaqCategories(): Promise<FaqCategory[]> {
  const res = await request<ApiEnvelope<FaqCategoryWithItems[]>>("/api/support/faq");
  return (res.data ?? []).map(({ id, name, order }) => ({ id, name, order }));
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

export async function sendTicketMessage(id: string, payload: SendTicketMessagePayload): Promise<TicketMessage> {
  const res = await request<ApiEnvelope<TicketMessage>>(`/api/support/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getAttachmentUploadUrl(
  ticketId: string,
  payload: UploadAttachmentRequestPayload
): Promise<UploadAttachmentResponse> {
  const res = await request<ApiEnvelope<UploadAttachmentResponse>>(
    `/api/support/tickets/${ticketId}/attachments/upload-url`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return res.data;
}

/** Uploads a file straight to storage using a presigned PUT URL — same pattern as certificate image uploads. */
export async function uploadTicketAttachment(ticketId: string, file: File) {
  const { upload_url, storage_key } = await getAttachmentUploadUrl(ticketId, {
    file_name: file.name,
    content_type: file.type,
  });
  const putRes = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) {
    throw new Error("File upload to storage failed. Please try again.");
  }
  return {
    attachment_storage_key: storage_key,
    attachment_file_name: file.name,
    attachment_mime_type: file.type,
    attachment_file_size_bytes: file.size,
  };
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

// Staff roster
//
// Anyone assignable to a ticket is an ADMIN (always staff) or an active "Support Desk" group
// member (e.g. an INSTRUCTOR who's been added to it). There's no single endpoint for that
// roster, so this merges GET /users?user_type=ADMIN with the Support Desk group's members —
// both of which are ADMIN-only calls. Only call this for an ADMIN viewer; a non-admin staff
// member (e.g. an instructor) can't reach either endpoint and should fall back to "assign to
// me" instead.

export async function getAssignableStaff(): Promise<User[]> {
  const [adminsRes, groupsRes] = await Promise.all([
    getUsers({ userType: "ADMIN", pageSize: 100 }),
    getGroups(1, 100),
  ]);

  const supportDesk = groupsRes.items.find((g) => g.name === SUPPORT_DESK_GROUP_NAME);
  const deskMembers = supportDesk ? (await getGroupMembers(supportDesk.id, 1, 100)).items.map((m) => m.user) : [];

  const byId = new Map<string, User>();
  for (const user of [...(adminsRes.data ?? []), ...deskMembers]) byId.set(user.id, user);
  return Array.from(byId.values());
}
