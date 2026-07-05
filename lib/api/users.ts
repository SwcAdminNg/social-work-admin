import { ApiError } from "./client";
import { UsersApiResponse } from "./users.types";

export type GetUsersParams = {
  page?: number;
  pageSize?: number;
  platform?: "NG" | "COM";
  userType?: "USER" | "INSTRUCTOR" | "ADMIN";
  search?: string;
};

export async function getUsers(
  params: GetUsersParams = {},
): Promise<UsersApiResponse> {
  const { page, pageSize, platform, userType, search } = params;

  const query = new URLSearchParams();
  if (page) query.set("page", String(page));
  if (pageSize) query.set("page_size", String(pageSize));
  if (platform) query.set("platform", platform);
  if (userType) query.set("user_type", userType);
  if (search) query.set("search", search);

  const queryString = query.toString();
  const path = `/api/users${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(path);

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : undefined) ?? res.statusText;
    throw new ApiError(message, res.status, payload);
  }

  return payload as UsersApiResponse;
}
