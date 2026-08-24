import { ApiError, ApiEnvelope } from "./client";
import type { PaginatedResult } from "./courses.types";
import type { AddGroupMemberPayload, CreateGroupPayload, Group, GroupMember, UpdateGroupPayload } from "./groups.types";

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

export async function getGroups(page = 1, pageSize = 20): Promise<PaginatedResult<Group>> {
  const res = await request<ApiEnvelope<Group[]>>(`/api/groups?page=${page}&page_size=${pageSize}`);
  return toPaginated(res, page, pageSize);
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  const res = await request<ApiEnvelope<Group>>("/api/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateGroup(id: string, payload: UpdateGroupPayload): Promise<Group> {
  const res = await request<ApiEnvelope<Group>>(`/api/groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deactivateGroup(id: string): Promise<Group> {
  const res = await request<ApiEnvelope<Group>>(`/api/groups/${id}/deactivate`, { method: "POST" });
  return res.data;
}

export async function getGroupMembers(id: string, page = 1, pageSize = 20): Promise<PaginatedResult<GroupMember>> {
  const res = await request<ApiEnvelope<GroupMember[]>>(
    `/api/groups/${id}/members?page=${page}&page_size=${pageSize}`
  );
  return toPaginated(res, page, pageSize);
}

export async function addGroupMember(id: string, payload: AddGroupMemberPayload): Promise<GroupMember> {
  const res = await request<ApiEnvelope<GroupMember>>(`/api/groups/${id}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function removeGroupMember(id: string, userId: string): Promise<void> {
  await request(`/api/groups/${id}/members/${userId}`, { method: "DELETE" });
}
