import { apiClient, ApiEnvelope } from "./client";
import type {
  Resource,
  ResourceManageDetail,
  ManagedResourceListParams,
  CreateResourcePayload,
  UpdateResourcePayload,
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

export async function createResource(
  payload: CreateResourcePayload,
  token: string
): Promise<Resource> {
  const res = await apiClient.post<ApiEnvelope<Resource>>("/resources", payload, { token });
  return res.data;
}

export async function listManagedResources(
  params: ManagedResourceListParams,
  token: string
): Promise<PaginatedResult<Resource>> {
  const res = await apiClient.get<ApiEnvelope<Resource[]>>(
    `/resources/manage${buildQuery(params)}`,
    { token }
  );
  return { items: res.data, meta: res.meta! };
}

export async function getManagedResource(id: string, token: string): Promise<ResourceManageDetail> {
  const res = await apiClient.get<ApiEnvelope<ResourceManageDetail>>(`/resources/manage/${id}`, {
    token,
  });
  return res.data;
}

export async function updateResource(
  id: string,
  payload: UpdateResourcePayload,
  token: string
): Promise<Resource> {
  const res = await apiClient.patch<ApiEnvelope<Resource>>(`/resources/${id}`, payload, { token });
  return res.data;
}

export async function publishResource(
  id: string,
  isPublished: boolean,
  token: string
): Promise<Resource> {
  const res = await apiClient.patch<ApiEnvelope<Resource>>(
    `/resources/${id}/publish?is_published=${isPublished}`,
    undefined,
    { token }
  );
  return res.data;
}

export async function deleteResource(id: string, token: string): Promise<void> {
  await apiClient.delete(`/resources/${id}`, { token });
}
