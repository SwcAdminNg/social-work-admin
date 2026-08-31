export type CommunityType = "COURSE" | "GENERAL" | "HELP" | "CUSTOM";

export type CommunityAddedVia = "MANUAL" | "COURSE_SNAPSHOT";

export type CommunityAttachmentKind = "IMAGE" | "DOCUMENT";

export interface CommunityMemberUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
}

export interface Community {
  id: string;
  type: CommunityType;
  name: string;
  description?: string | null;
  course_id?: string | null;
  is_active: boolean;
  member_count?: number;
  created_at: string;
}

export interface CommunityMember {
  user: CommunityMemberUser;
  added_via: CommunityAddedVia | null;
  added_from_course_id: string | null;
  is_online: boolean;
}

export interface CommunityResourceReference {
  id: string;
  name?: string;
  slug?: string;
  thumbnail_url?: string | null;
}

export interface CommunityMessage {
  id: string;
  community_id: string;
  body: string | null;
  sender: CommunityMemberUser | null;
  reply_to_message_id?: string | null;
  reply_to?: CommunityMessage | null;
  // Same resolved-on-read shape as TicketMessage (support.types.ts) — the backend serves an
  // R2-backed attachment as a flat attachment_url once uploaded, since the upload-url endpoint
  // itself returns a `storage_key` (not a persistent URL) exactly like the ticket attachments.
  attachment_url?: string | null;
  attachment_file_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_file_size_bytes?: number | null;
  attachment_kind?: CommunityAttachmentKind | null;
  resource_reference_id?: string | null;
  resource_reference?: CommunityResourceReference | null;
  created_at: string;
}

export interface CreateCustomCommunityPayload {
  name: string;
  description?: string | null;
  user_ids?: string[];
  course_snapshot_ids?: string[];
}

export interface AddCommunityMembersPayload {
  user_ids?: string[];
  course_snapshot_id?: string;
}

export interface SendCommunityMessagePayload {
  body?: string;
  reply_to_message_id?: string | null;
  resource_reference_id?: string | null;
  // Matches SendTicketMessagePayload (support.types.ts) — the storage_key from the
  // upload-url response, not a URL.
  attachment_storage_key?: string;
  attachment_file_name?: string;
  attachment_mime_type?: string;
  attachment_file_size_bytes?: number;
}

export interface ListCustomCommunitiesParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface PaginatedMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}
