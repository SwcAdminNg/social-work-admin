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
  gender?: "MALE" | "FEMALE" | "OTHER";
  user_type: "USER" | "INSTRUCTOR" | "ADMIN";
  address?: string;
  is_active: boolean;
  is_suspended?: boolean;
  last_login_at?: string;
  cv_file_name?: string | null;
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

export interface ChangeUserRoleRequestDTO {
  role: "USER" | "INSTRUCTOR" | "ADMIN";
}

export interface UserUpdateDTO {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
}

export interface CvDownloadUrlResponse {
  download_url: string;
  cv_file_name: string;
}

export interface InstructorDocument {
  id: string;
  name: string;
  file_name: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  download_url: string;
  created_at: string;
  updated_at: string;
}
