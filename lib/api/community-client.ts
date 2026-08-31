import { ApiError, type ApiEnvelope } from "./client";
import type {
  AddCommunityMembersPayload,
  Community,
  CommunityMember,
  CommunityMessage,
  CreateCustomCommunityPayload,
  ListCustomCommunitiesParams,
  PaginatedResult,
  SendCommunityMessagePayload,
} from "./community.types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function isFormDataBody(body: unknown): body is FormData {
  if (typeof FormData !== "undefined" && body instanceof FormData) return true;
  return (
    body !== null &&
    typeof body === "object" &&
    typeof (body as Record<string, unknown>).append === "function"
  );
}

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const isFormData = isFormDataBody(options.body);
  const body = options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body);
  const res = await fetch(`/api/community${path}`, {
    method: options.method,
    headers: options.body !== undefined && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body: body as BodyInit | undefined,
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

  return payload as ApiEnvelope<T>;
}

// Communities

export async function listMyCommunities(): Promise<Community[]> {
  const res = await request<Community[]>("");
  return res.data ?? [];
}

export async function getCommunity(id: string): Promise<Community> {
  const res = await request<Community>(`/${id}`);
  return res.data;
}

export async function listCustomCommunities(
  params: ListCustomCommunitiesParams = {},
): Promise<PaginatedResult<Community>> {
  const res = await request<Community[]>(
    `/custom${buildQuery({ page: params.page ?? 1, page_size: params.page_size ?? 20, search: params.search })}`,
  );
  return { items: res.data ?? [], meta: res.meta! };
}

export async function createCustomCommunity(payload: CreateCustomCommunityPayload): Promise<Community> {
  const res = await request<Community>("/custom", { method: "POST", body: payload });
  return res.data;
}

// Membership

export async function listCommunityMembers(
  communityId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedResult<CommunityMember>> {
  const res = await request<CommunityMember[]>(
    `/${communityId}/members${buildQuery({ page, page_size: pageSize })}`,
  );
  return { items: res.data ?? [], meta: res.meta! };
}

export async function addCommunityMembers(
  communityId: string,
  payload: AddCommunityMembersPayload,
): Promise<void> {
  await request(`/${communityId}/members`, { method: "POST", body: payload });
}

export async function removeCommunityMember(communityId: string, userId: string): Promise<void> {
  await request(`/${communityId}/members/${userId}`, { method: "DELETE" });
}

// Messaging

/**
 * The backend returns each page most-recent-first (per COMMUNITY_ADMIN_API.md §6); page 1's
 * items are reversed here so callers can render straight top-to-bottom as oldest→newest, the
 * order a chat thread reads in.
 */
export async function getCommunityMessages(
  communityId: string,
  page = 1,
  pageSize = 30,
): Promise<PaginatedResult<CommunityMessage>> {
  const res = await request<CommunityMessage[]>(
    `/${communityId}/messages${buildQuery({ page, page_size: pageSize })}`,
  );
  return { items: (res.data ?? []).slice().reverse(), meta: res.meta! };
}

export async function sendCommunityMessage(
  communityId: string,
  payload: SendCommunityMessagePayload,
): Promise<CommunityMessage> {
  const res = await request<CommunityMessage>(`/${communityId}/messages`, { method: "POST", body: payload });
  return res.data;
}

interface CommunityAttachmentUploadCredentials {
  upload_url: string;
  storage_key: string;
}

export async function getCommunityAttachmentUploadUrl(
  communityId: string,
  payload: { file_name: string; content_type?: string },
): Promise<CommunityAttachmentUploadCredentials> {
  const res = await request<CommunityAttachmentUploadCredentials>(
    `/${communityId}/attachments/upload-url`,
    { method: "POST", body: payload },
  );
  return res.data;
}

/**
 * Uploads straight to storage via a presigned PUT URL — same pattern as ticket attachments
 * (support-client.ts's uploadTicketAttachment). The upload-url response only hands back a
 * `storage_key`, not a persistent URL (the presigned PUT URL itself expires in minutes), so the
 * storage_key is what gets sent to the message endpoint — the backend resolves the actual
 * (possibly signed) `attachment_url` when it returns the message.
 */
export async function uploadCommunityAttachment(communityId: string, file: File) {
  const { upload_url, storage_key } = await getCommunityAttachmentUploadUrl(communityId, {
    file_name: file.name,
    content_type: file.type || undefined,
  });
  const putRes = await fetch(upload_url, {
    method: "PUT",
    body: file,
    headers: file.type ? { "Content-Type": file.type } : undefined,
  });
  if (!putRes.ok) {
    throw new Error("File upload to storage failed. Please try again.");
  }
  return {
    attachment_storage_key: storage_key,
    attachment_file_name: file.name,
    attachment_mime_type: file.type || undefined,
    attachment_file_size_bytes: file.size,
  };
}

// Presence

export async function getOnlineCommunityMembers(communityId: string): Promise<CommunityMemberUserId[]> {
  const res = await request<CommunityMemberUserId[]>(`/${communityId}/online`);
  return res.data ?? [];
}

export async function sendCommunityPresenceHeartbeat(): Promise<void> {
  await request("/presence/heartbeat", { method: "POST" });
}

type CommunityMemberUserId = string;

// Read state

export async function getUnreadCommunityCount(): Promise<number> {
  const res = await request<{ unread_count: number }>("/unread-count");
  return res.data?.unread_count ?? 0;
}

export async function markCommunityRead(communityId: string): Promise<void> {
  await request(`/${communityId}/read`, { method: "POST" });
}
