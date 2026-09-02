import { ApiError, ApiEnvelope } from "./client";
import type {
  PaginatedResponse,
  CouponReadDTO,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "./coupons.types";

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/coupons${path}`, {
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

export async function getCoupons(
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<CouponReadDTO>> {
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  }).toString();
  const res = await request<CouponReadDTO[]>(`?${query}`);
  return {
    items: res.data,
    total_items: res.meta?.total_items || 0,
    page: res.meta?.page || page,
    page_size: res.meta?.page_size || pageSize,
    total_pages: res.meta?.total_pages || 1,
  };
}

export async function getCoupon(couponId: string): Promise<CouponReadDTO> {
  const res = await request<CouponReadDTO>(`/${couponId}`);
  return res.data;
}

export async function createCoupon(
  payload: CreateCouponPayload,
): Promise<CouponReadDTO> {
  const res = await request<CouponReadDTO>(``, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function updateCoupon(
  couponId: string,
  payload: UpdateCouponPayload,
): Promise<CouponReadDTO> {
  const res = await request<CouponReadDTO>(`/${couponId}`, {
    method: "PATCH",
    body: payload,
  });
  return res.data;
}

export async function deleteCoupon(couponId: string): Promise<void> {
  await request(`/${couponId}`, { method: "DELETE" });
}
