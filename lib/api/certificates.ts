import { apiClient, ApiEnvelope } from "./client";
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

export async function createCertificateTemplate(
  payload: CertificateTemplateCreatePayload,
  token: string
): Promise<CertificateTemplate> {
  const res = await apiClient.post<ApiEnvelope<CertificateTemplate>>("/certificates/templates", payload, {
    token,
  });
  return res.data;
}

export async function listCertificateTemplates(
  params: CertificateTemplateListParams,
  token: string
): Promise<PaginatedResult<CertificateTemplate>> {
  const res = await apiClient.get<ApiEnvelope<CertificateTemplate[]>>(
    `/certificates/templates${buildQuery(params)}`,
    { token }
  );
  return { items: res.data, meta: res.meta! };
}

export async function getCertificateTemplate(id: string, token: string): Promise<CertificateTemplate> {
  const res = await apiClient.get<ApiEnvelope<CertificateTemplate>>(`/certificates/templates/${id}`, {
    token,
  });
  return res.data;
}

export async function updateCertificateTemplate(
  id: string,
  payload: CertificateTemplateUpdatePayload,
  token: string
): Promise<CertificateTemplate> {
  const res = await apiClient.patch<ApiEnvelope<CertificateTemplate>>(
    `/certificates/templates/${id}`,
    payload,
    { token }
  );
  return res.data;
}

export async function deleteCertificateTemplate(id: string, token: string): Promise<void> {
  await apiClient.delete(`/certificates/templates/${id}`, { token });
}

export async function getLogoUploadUrl(
  templateId: string,
  payload: CertificateImageUploadRequestPayload,
  token: string
): Promise<CertificateImageUploadResponse> {
  const res = await apiClient.post<ApiEnvelope<CertificateImageUploadResponse>>(
    `/certificates/templates/${templateId}/logo-upload-url`,
    payload,
    { token }
  );
  return res.data;
}

export async function getSignatureUploadUrl(
  templateId: string,
  payload: CertificateImageUploadRequestPayload,
  token: string
): Promise<CertificateImageUploadResponse> {
  const res = await apiClient.post<ApiEnvelope<CertificateImageUploadResponse>>(
    `/certificates/templates/${templateId}/signature-upload-url`,
    payload,
    { token }
  );
  return res.data;
}

export async function updateCourseCertificateSettings(
  courseId: string,
  payload: CourseCertificateSettingsPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/certificates/courses/${courseId}/settings`, payload, { token });
}
