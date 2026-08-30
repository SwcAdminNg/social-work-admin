import { ApiError, type ApiEnvelope } from "./client";
import type {
  Resource,
  ResourceManageDetail,
  ResourceAttachment,
  ManagedResourceListParams,
  CreateResourcePayload,
  UpdateResourcePayload,
  CreateAttachmentPayload,
  CreateAttachmentResult,
  UpdateAttachmentPayload,
  ReorderAttachmentsPayload,
  FinalizeResourceDocumentPayload,
  ResourceVideoUploadCredentials,
  PaginatedResult,
} from "./resources.types";

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
  const body = options.body === undefined ? undefined : isFormData ? options.body as FormData : JSON.stringify(options.body);
  const res = await fetch(`/api/resources${path}`, {
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

export async function createResource(payload: CreateResourcePayload): Promise<Resource> {
  const res = await request<Resource>("", { method: "POST", body: payload });
  return res.data;
}

export async function listManagedResources(
  params: ManagedResourceListParams,
): Promise<PaginatedResult<Resource>> {
  const res = await request<Resource[]>(`/manage${buildQuery(params)}`, { method: "GET" });
  return { items: res.data, meta: res.meta! };
}

export async function getManagedResource(id: string): Promise<ResourceManageDetail> {
  const res = await request<ResourceManageDetail>(`/manage/${id}`, { method: "GET" });
  return res.data;
}

export async function updateResource(
  id: string,
  payload: UpdateResourcePayload,
): Promise<Resource> {
  const res = await request<Resource>(`/${id}`, { method: "PATCH", body: payload });
  return res.data;
}

export async function publishResource(id: string, isPublished: boolean): Promise<Resource> {
  const res = await request<Resource>(`/${id}/publish?is_published=${isPublished}`, {
    method: "PATCH",
  });
  return res.data;
}

export async function deleteResource(id: string): Promise<void> {
  await request(`/${id}`, { method: "DELETE" });
}

export async function getThumbnailUploadUrl(
  resourceId: string,
  payload: { file_name: string; content_type: string },
): Promise<{ upload_url: string; thumbnail_url: string }> {
  const res = await request<{ upload_url: string; thumbnail_url: string }>(
    `/${resourceId}/thumbnail-upload-url`,
    { method: "POST", body: payload },
  );
  return res.data;
}

export async function createAttachment(
  resourceId: string,
  payload: CreateAttachmentPayload,
): Promise<CreateAttachmentResult> {
  const res = await request<CreateAttachmentResult>(`/${resourceId}/attachments`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function updateAttachment(
  attachmentId: string,
  payload: UpdateAttachmentPayload,
): Promise<void> {
  await request(`/attachments/${attachmentId}`, { method: "PATCH", body: payload });
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await request(`/attachments/${attachmentId}`, { method: "DELETE" });
}

export async function reorderAttachments(
  resourceId: string,
  payload: ReorderAttachmentsPayload,
): Promise<void> {
  await request(`/${resourceId}/attachments/reorder`, { method: "PATCH", body: payload });
}

export async function finalizeAttachmentDocument(
  attachmentId: string,
  payload: FinalizeResourceDocumentPayload,
): Promise<void> {
  await request(`/attachments/${attachmentId}/document/finalize`, { method: "POST", body: payload });
}

export async function refreshAttachmentVideoUpload(
  attachmentId: string,
): Promise<ResourceVideoUploadCredentials> {
  const res = await request<ResourceVideoUploadCredentials>(
    `/attachments/${attachmentId}/video/refresh-upload`,
    { method: "POST" },
  );
  return res.data;
}

export type { ResourceAttachment };
