import { ApiError, ApiEnvelope } from "./client";
import type {
  PaginatedResponse,
  TransactionReadDTO,
  SavedCardResponse,
  CourseTransactionReadDTO,
} from "./payments.types";
import type { Course } from "./courses.types";

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/customer-support${path}`, {
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

export async function getUserTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<TransactionReadDTO>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();
  const res = await request<TransactionReadDTO[]>(`/users/${userId}/transactions?${query}`);
  return {
    items: res.data,
    total: res.meta?.total_items || 0,
    page: res.meta?.page || page,
    page_size: res.meta?.page_size || limit,
    total_pages: res.meta?.total_pages || 1,
  };
}

export async function getUserCourses(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<Course>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();
  const res = await request<Course[]>(`/users/${userId}/courses?${query}`);
  return {
    items: res.data,
    total: res.meta?.total_items || 0,
    page: res.meta?.page || page,
    page_size: res.meta?.page_size || limit,
    total_pages: res.meta?.total_pages || 1,
  };
}

export async function getUserCards(
  userId: string
): Promise<SavedCardResponse[]> {
  const res = await request<SavedCardResponse[]>(`/users/${userId}/cards`);
  return res.data;
}

export async function getCourseTransactions(
  courseId: string,
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<CourseTransactionReadDTO>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();
  const res = await request<CourseTransactionReadDTO[]>(`/courses/${courseId}/transactions?${query}`);
  return {
    items: res.data,
    total: res.meta?.total_items || 0,
    page: res.meta?.page || page,
    page_size: res.meta?.page_size || limit,
    total_pages: res.meta?.total_pages || 1,
  };
}
