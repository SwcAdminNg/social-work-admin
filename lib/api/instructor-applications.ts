import { apiClient, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type {
  GetInstructorApplicationsParams,
  InstructorApplicationDetail,
  InstructorApplicationSummary,
} from "./instructor-applications.types";

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

export async function getInstructorApplications(
  params: GetInstructorApplicationsParams,
  token: string
): Promise<PaginatedResult<InstructorApplicationSummary>> {
  const res = await apiClient.get<ApiEnvelope<InstructorApplicationSummary[]>>(
    `/admin/instructor-applications${buildQuery(params)}`,
    { token }
  );
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

export async function getInstructorApplication(id: string, token: string): Promise<InstructorApplicationDetail> {
  const res = await apiClient.get<ApiEnvelope<InstructorApplicationDetail>>(`/admin/instructor-applications/${id}`, {
    token,
  });
  return res.data;
}
