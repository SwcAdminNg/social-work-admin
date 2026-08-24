import type { User } from "./users.types";

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  user: User;
  created_at?: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface AddGroupMemberPayload {
  user_id: string;
}
