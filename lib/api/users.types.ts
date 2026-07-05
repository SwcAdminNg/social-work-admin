export interface User {
  id: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  phone_number: string;
  platform: "NG" | "COM";
  user_type: "USER" | "INSTRUCTOR" | "ADMIN";
  is_active: boolean;
  last_login_at?: string;
}

export interface UsersApiResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface InviteAdminRequestDTO {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number?: string | null;
  platform: "NG" | "COM";
}

export interface AdminInviteResponseDTO {
  user: User;
}

export interface AcceptAdminInviteRequestDTO {
  token: string;
  password?: string;
  confirm_password?: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}
