// Server-side first loads for the course studio pages. These never throw:
// a failed read returns null (or the HTTP status) and the client re-fetches
// through react-query, matching the instructor app.
import { apiClient, ApiError, type ApiEnvelope } from "@/lib/api/client";
import type { UserAccess } from "./access";
import type { ManagedCourse, Paginated } from "./types";

export async function readAccess(token: string): Promise<UserAccess | null> {
  try {
    const res = await apiClient.get<ApiEnvelope<{ access?: UserAccess | null }>>("/users/me", { token, cache: "no-store" });
    return res.data?.access ?? null;
  } catch {
    return null;
  }
}

export async function readCourses(token: string): Promise<Paginated<ManagedCourse> | null> {
  try {
    const res = await apiClient.get<ApiEnvelope<ManagedCourse[]>>("/courses/manage?page=1&page_size=50", {
      token,
      cache: "no-store",
    });
    return { items: Array.isArray(res.data) ? res.data : [], meta: res.meta };
  } catch {
    return null;
  }
}

export async function readCourse(
  id: string,
  token: string,
): Promise<{ course: ManagedCourse; status: 200 } | { course: null; status: number }> {
  try {
    const res = await apiClient.get<ApiEnvelope<ManagedCourse>>(`/courses/manage/${id}`, { token, cache: "no-store" });
    return { course: res.data, status: 200 };
  } catch (error) {
    return { course: null, status: error instanceof ApiError ? error.status : 0 };
  }
}

/** Admins get every capability; the backend still enforces permissions on writes. */
export function adminAccess(access: UserAccess | null): UserAccess {
  return {
    ...access,
    capabilities: {
      can_create_courses: true,
      can_edit_content: true,
      can_publish: true,
      can_archive: true,
      can_access_approval_centre: true,
      ...access?.capabilities,
    },
  };
}
