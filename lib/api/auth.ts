import { apiClient } from "./client";

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

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
}

export function login(payload: LoginPayload) {
  return apiClient.post<LoginResponse>("/auth/login", payload);
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
