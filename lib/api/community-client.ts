import { ApiError, type ApiEnvelope } from "./client";
import type {
  AddCommunityMembersPayload,
  Community,
  CommunityAttachment,
  CommunityMember,
  CommunityMessage,
  CreateCustomCommunityPayload,
  ListCustomCommunitiesParams,
  PaginatedResult,
  SendCommunityMessagePayload,
} from "./community.types";

/**
 * The doc's data model lists a single `attachment` field on a message, but tolerates that the
 * wire format might flatten it (attachment_url/attachment_kind/attachment_file_name) instead —
 * this normalizes either shape into the nested `CommunityAttachment` the UI expects, so a
 * mismatch here doesn't silently drop the attachment from the rendered message.
 */
function normalizeAttachment(raw: unknown): CommunityAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const url = (obj.url ?? obj.attachment_url ?? obj.file_url ?? obj.public_url) as string | undefined;
  if (!url) return null;
  const kind = (obj.kind ?? obj.attachment_kind ?? "DOCUMENT") as CommunityAttachment["kind"];
  const fileName = (obj.file_name ?? obj.attachment_file_name ?? obj.filename) as string | undefined;
  return { url, kind, file_name: fileName ?? null };
}

export function normalizeMessage(raw: unknown): CommunityMessage {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const flatAttachment = obj.attachment_url
    ? { url: obj.attachment_url, kind: obj.attachment_kind, file_name: obj.attachment_file_name }
    : null;
  return {
    ...(obj as unknown as CommunityMessage),
    attachment: normalizeAttachment(obj.attachment ?? flatAttachment),
    reply_to: obj.reply_to ? normalizeMessage(obj.reply_to) : null,
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
  return { items: (res.data ?? []).slice().reverse().map(normalizeMessage), meta: res.meta! };
}

export async function sendCommunityMessage(
  communityId: string,
  payload: SendCommunityMessagePayload,
): Promise<CommunityMessage> {
  const res = await request<CommunityMessage>(`/${communityId}/messages`, { method: "POST", body: payload });
  return normalizeMessage(res.data);
}

interface CommunityAttachmentUploadCredentials {
  upload_url: string;
  attachment_url?: string;
  // Field-name fallbacks — the doc doesn't pin this down, so tolerate whatever the backend
  // actually calls the resulting public URL rather than silently dropping it.
  url?: string;
  file_url?: string;
  public_url?: string;
  storage_key?: string;
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

/** Uploads straight to storage via a presigned PUT URL — same pattern as ticket attachments. */
export async function uploadCommunityAttachment(communityId: string, file: File) {
  const credentials = await getCommunityAttachmentUploadUrl(communityId, {
    file_name: file.name,
    content_type: file.type || undefined,
  });
  const attachmentUrl =
    credentials.attachment_url ?? credentials.url ?? credentials.file_url ?? credentials.public_url;
  if (!attachmentUrl) {
    throw new Error(
      "The server didn't return a usable attachment URL for this upload — check the attachments/upload-url response shape.",
    );
  }
  const putRes = await fetch(credentials.upload_url, {
    method: "PUT",
    body: file,
    headers: file.type ? { "Content-Type": file.type } : undefined,
  });
  if (!putRes.ok) {
    throw new Error("File upload to storage failed. Please try again.");
  }
  const attachment: CommunityAttachment = {
    url: attachmentUrl,
    file_name: file.name,
    kind: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
  };
  return { attachment };
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
