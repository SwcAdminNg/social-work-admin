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
