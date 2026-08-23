import { ApiError, type ApiEnvelope } from "./client";
import type {
  CertificateImageUploadRequestPayload,
  CertificateImageUploadResponse,
  CertificateTemplate,
  CertificateTemplateCreatePayload,
  CertificateTemplateListParams,
  CertificateTemplateUpdatePayload,
  CourseCertificateSettingsPayload,
} from "./certificates.types";
import type { PaginatedResult } from "./courses.types";

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

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/certificates${path}`, {
    method: options.method,
    headers:
      options.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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

export async function createCertificateTemplate(
  payload: CertificateTemplateCreatePayload,
): Promise<CertificateTemplate> {
  const res = await request<CertificateTemplate>("/templates", { method: "POST", body: payload });
  return res.data;
}

export async function listCertificateTemplates(
  params: CertificateTemplateListParams = {},
): Promise<PaginatedResult<CertificateTemplate>> {
  const res = await request<CertificateTemplate[]>(`/templates${buildQuery(params)}`, { method: "GET" });
  return { items: res.data, meta: res.meta! };
}

export async function getCertificateTemplate(id: string): Promise<CertificateTemplate> {
  const res = await request<CertificateTemplate>(`/templates/${id}`, { method: "GET" });
  return res.data;
}

export async function updateCertificateTemplate(
  id: string,
  payload: CertificateTemplateUpdatePayload,
): Promise<CertificateTemplate> {
  const res = await request<CertificateTemplate>(`/templates/${id}`, { method: "PATCH", body: payload });
  return res.data;
}

export async function deleteCertificateTemplate(id: string): Promise<void> {
  await request(`/templates/${id}`, { method: "DELETE" });
}

export async function getLogoUploadUrl(
  templateId: string,
  payload: CertificateImageUploadRequestPayload,
): Promise<CertificateImageUploadResponse> {
  const res = await request<CertificateImageUploadResponse>(`/templates/${templateId}/logo-upload-url`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function getSignatureUploadUrl(
  templateId: string,
  payload: CertificateImageUploadRequestPayload,
): Promise<CertificateImageUploadResponse> {
  const res = await request<CertificateImageUploadResponse>(
    `/templates/${templateId}/signature-upload-url`,
    { method: "POST", body: payload },
  );
  return res.data;
}

export async function updateCourseCertificateSettings(
  courseId: string,
  payload: CourseCertificateSettingsPayload,
): Promise<void> {
  await request(`/courses/${courseId}/settings`, { method: "PATCH", body: payload });
}
