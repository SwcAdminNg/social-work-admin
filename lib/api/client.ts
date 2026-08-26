const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function serializeBody(body: unknown): BodyInit {
  if (isFormDataBody(body)) return body;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) return body;
  if (typeof Blob !== "undefined" && body instanceof Blob) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (body !== undefined && !isFormDataBody(body) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? serializeBody(body) : undefined,
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

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
