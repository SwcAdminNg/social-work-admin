import { apiClient, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { Group, GroupMember } from "./groups.types";

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

export async function getGroups(
  params: { page?: number; page_size?: number },
  token: string
): Promise<PaginatedResult<Group>> {
  const res = await apiClient.get<ApiEnvelope<Group[]>>(`/groups${buildQuery(params)}`, { token });
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

export async function getGroup(id: string, token: string): Promise<Group> {
  const res = await apiClient.get<ApiEnvelope<Group>>(`/groups/${id}`, { token });
  return res.data;
}

export async function getGroupMembers(
  id: string,
  params: { page?: number; page_size?: number },
  token: string
): Promise<PaginatedResult<GroupMember>> {
  const res = await apiClient.get<ApiEnvelope<GroupMember[]>>(`/groups/${id}/members${buildQuery(params)}`, {
    token,
  });
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
