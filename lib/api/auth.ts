import { apiClient, ApiError } from "./client";

export interface LoginPayload {
  identifier: string;
  password: string;
  keep_logged_in: boolean;
}

export interface AuthUser {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone_number: string;
  platform: string;
  user_type: string;
  is_active: boolean;
  last_login_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type TwoFactorMethod = "EMAIL" | "TOTP";

export interface TwoFactorChallenge {
  challenge_token: string;
  method?: TwoFactorMethod;
}

export interface LoginChallengeResponse {
  success: boolean;
  message: string;
  data: {
    status: "two_factor_setup_required" | "two_factor_verification_required";
    challenge: TwoFactorChallenge;
  };
}

export interface AuthSessionData {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface AuthSessionResponse {
  success: boolean;
  message: string;
  data: AuthSessionData;
}

export function login(payload: LoginPayload) {
  return apiClient.post<LoginChallengeResponse>("/auth/login", payload);
}

export interface UsernameSuggestionsResponse {
  success: boolean;
  message: string;
  data: {
    suggestions: string[];
  };
}

export interface UsernameAvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    username: string;
    available: boolean;
  };
}

export async function getUsernameSuggestions(firstName: string, lastName: string): Promise<UsernameSuggestionsResponse> {
  const query = new URLSearchParams({ first_name: firstName, last_name: lastName });
  const res = await fetch(`/api/auth/username/suggestions?${query.toString()}`);

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = payload?.message ?? res.statusText;
    throw new Error(message);
  }

  return payload as UsernameSuggestionsResponse;
}

export async function checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
  const query = new URLSearchParams({ username });
  const res = await fetch(`/api/auth/username/availability?${query.toString()}`);

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = payload?.message ?? res.statusText;
    throw new Error(message);
  }

  return payload as UsernameAvailabilityResponse;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export function loginRequest(payload: LoginPayload) {
  return postJson<LoginChallengeResponse>("/api/auth/login", payload);
}

export interface TotpSetupStartResponse {
  success: boolean;
  message: string;
  data: {
    secret: string;
    otpauth_url: string;
    qr_code_data_uri: string;
  };
}

export function totpSetupStart(challengeToken: string) {
  return postJson<TotpSetupStartResponse>("/api/auth/2fa/setup/totp/start", {
    challenge_token: challengeToken,
  });
}

export function totpSetupConfirm(challengeToken: string, code: string) {
  return postJson<AuthSessionResponse>("/api/auth/2fa/setup/totp/confirm", {
    challenge_token: challengeToken,
    code,
  });
}

export interface MessageOnlyResponse {
  success: boolean;
  message: string;
  data: null;
}

export function emailSetupStart(challengeToken: string) {
  return postJson<MessageOnlyResponse>("/api/auth/2fa/setup/email/start", {
    challenge_token: challengeToken,
  });
}

export function emailSetupConfirm(challengeToken: string, code: string) {
  return postJson<AuthSessionResponse>("/api/auth/2fa/setup/email/confirm", {
    challenge_token: challengeToken,
    code,
  });
}

export function twoFactorLoginVerify(challengeToken: string, code: string) {
  return postJson<AuthSessionResponse>("/api/auth/2fa/login/verify", {
    challenge_token: challengeToken,
    code,
  });
}

export function twoFactorLoginResend(challengeToken: string) {
  return postJson<MessageOnlyResponse>("/api/auth/2fa/login/resend", {
    challenge_token: challengeToken,
  });
}

export interface TwoFactorStatusResponse {
  success: boolean;
  message: string;
  data: {
    two_factor_enabled: boolean;
    two_factor_method: TwoFactorMethod;
  };
}

async function getJson<T>(path: string): Promise<T> {
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

  return payload as T;
}

export function getTwoFactorStatus() {
  return getJson<TwoFactorStatusResponse>("/api/auth/2fa/status");
}

export function switchToTotpStart() {
  return postJson<TotpSetupStartResponse>("/api/auth/2fa/totp/start", {});
}

export function switchToTotpConfirm(code: string) {
  return postJson<TwoFactorStatusResponse>("/api/auth/2fa/totp/confirm", { code });
}

export function switchToEmailStart() {
  return postJson<MessageOnlyResponse>("/api/auth/2fa/email/start", {});
}

export function switchToEmailConfirm(code: string) {
  return postJson<TwoFactorStatusResponse>("/api/auth/2fa/email/confirm", { code });
}
