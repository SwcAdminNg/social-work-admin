export type ResourceCategory =
  | "COURSE_MATERIALS"
  | "PRACTICE_RESOURCES"
  | "POLICIES_AND_GUIDANCE"
  | "TEMPLATES_AND_FORMS"
  | "VIDEOS_AND_WEBINARS"
  | "RESEARCH_AND_PUBLICATIONS"
  | "CAREER_AND_CPD"
  | "USEFUL_LINKS";

export type ResourceVisibility = "PUBLIC" | "LOGGED_IN" | "COURSE_ENROLLED";

export type ResourceAttachmentType = "VIDEO" | "DOCUMENT" | "LINKS";

export type ResourceVideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface Resource {
  id: string;
  name: string;
  slug: string;
  category: ResourceCategory;
  description: string | null;
  thumbnail_url: string | null;
  visibility: ResourceVisibility;
  course_id: string | null;
  course_title?: string | null;
  owner_id: string;
  is_published: boolean;
}

export interface ResourceVideo {
  status: ResourceVideoStatus;
  playback_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  bunny_video_guid?: string;
}

export interface ResourceDocument {
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  is_uploaded: boolean;
  downloadable?: boolean;
  storage_key?: string;
}

export interface ResourceLink {
  url: string;
  label: string | null;
  description: string | null;
}

export interface ResourceAttachment {
  id: string;
  title: string;
  attachment_type: ResourceAttachmentType;
  order_index: number;
  video: ResourceVideo | null;
  document: ResourceDocument | null;
  link: ResourceLink | null;
}

export interface ResourceManageDetail extends Resource {
  attachments: ResourceAttachment[];
}

// Request payloads

export interface CreateResourcePayload {
  name: string;
  category: ResourceCategory;
  description?: string | null;
  thumbnail_url?: string | null;
  visibility?: ResourceVisibility;
  course_id?: string | null;
}

export type UpdateResourcePayload = Partial<CreateResourcePayload>;

export interface CreateAttachmentPayload {
  title: string;
  attachment_type: ResourceAttachmentType;
  order_index?: number;
  file_name?: string | null;
  downloadable?: boolean;
  url?: string;
  label?: string | null;
  description?: string | null;
}

export interface UpdateAttachmentPayload {
  title?: string;
  order_index?: number;
  downloadable?: boolean;
  url?: string;
  label?: string | null;
  description?: string | null;
}

export interface ReorderAttachmentsPayload {
  attachments: { id: string; order_index: number }[];
}

export interface ResourceVideoUploadCredentials {
  tus_endpoint: string;
  library_id: string;
  video_id: string;
  authorization_signature: string;
  authorization_expire: number;
}

export interface ResourceDocumentUploadCredentials {
  upload_url: string;
  storage_key: string;
}

export interface CreateAttachmentResult extends ResourceAttachment {
  video_upload: ResourceVideoUploadCredentials | null;
  document_upload: ResourceDocumentUploadCredentials | null;
}

export interface FinalizeResourceDocumentPayload {
  mime_type: string;
  file_size_bytes: number;
}

export interface ManagedResourceListParams {
  page?: number;
  page_size?: number;
  category?: ResourceCategory;
  course_id?: string;
  search?: string;
  is_published?: boolean;
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
