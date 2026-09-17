import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type {
  ApproveInstructorApplicationPayload,
  GetInstructorApplicationsParams,
  InstructorApplicationDetail,
  InstructorApplicationSummary,
  RejectInstructorApplicationPayload,
} from "./instructor-applications.types";

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

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
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

export async function getInstructorApplications(
  params: GetInstructorApplicationsParams = {}
): Promise<PaginatedResult<InstructorApplicationSummary>> {
  const page = params.page ?? 1;
  const pageSize = params.page_size ?? 20;
  const res = await request<ApiEnvelope<InstructorApplicationSummary[]>>(
    `/api/instructor-applications${buildQuery({ status: params.status, page, page_size: pageSize })}`
  );
  return toPaginated(res, page, pageSize);
}

export async function getInstructorApplication(id: string): Promise<InstructorApplicationDetail> {
  const res = await request<ApiEnvelope<InstructorApplicationDetail>>(`/api/instructor-applications/${id}`);
  return res.data;
}

export async function approveInstructorApplication(
  id: string,
  payload: ApproveInstructorApplicationPayload
): Promise<InstructorApplicationDetail> {
  const res = await request<ApiEnvelope<InstructorApplicationDetail>>(`/api/instructor-applications/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function rejectInstructorApplication(
  id: string,
  payload: RejectInstructorApplicationPayload
): Promise<InstructorApplicationDetail> {
  const res = await request<ApiEnvelope<InstructorApplicationDetail>>(`/api/instructor-applications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function resendInstructorApplicationSetupLink(id: string): Promise<{ message: string }> {
  const res = await request<ApiEnvelope<{ message: string }>>(`/api/instructor-applications/${id}/resend-link`, {
    method: "POST",
  });
  return res.data;
}
