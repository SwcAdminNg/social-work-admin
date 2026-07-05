import { ApiError, ApiEnvelope } from "./client";
import type {
  PaginatedResponse,
  TransactionReadDTO,
  SubscriptionPlanResponse,
  CreateSubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
} from "./payments.types";

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/payments${path}`, {
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

  // The proxy route returns the backend response directly since we do NextResponse.json(data)
  return payload as ApiEnvelope<T>;
}

export async function getAdminPayments(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<TransactionReadDTO>> {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  }).toString();
  const res = await request<TransactionReadDTO[]>(`/transactions?${query}`);
  return {
    items: res.data,
    total: res.meta?.total_items || 0,
    page: res.meta?.page || page,
    page_size: res.meta?.page_size || pageSize,
    total_pages: res.meta?.total_pages || 1,
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
  const res = await request<SubscriptionPlanResponse[]>(`/plans`);
  return res.data;
}

export async function createSubscriptionPlan(
  payload: CreateSubscriptionPlanPayload
): Promise<SubscriptionPlanResponse> {
  const res = await request<SubscriptionPlanResponse>(`/plans`, { method: "POST", body: payload });
  return res.data;
}

export async function updateSubscriptionPlan(
  planId: string,
  payload: UpdateSubscriptionPlanPayload
): Promise<SubscriptionPlanResponse> {
  const res = await request<SubscriptionPlanResponse>(`/plans/${planId}`, { method: "PATCH", body: payload });
  return res.data;
}

export async function deleteSubscriptionPlan(planId: string): Promise<void> {
  await request(`/plans/${planId}`, { method: "DELETE" });
}
