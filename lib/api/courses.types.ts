export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type CourseCategory =
  | "DEVELOPMENT"
  | "BUSINESS"
  | "FINANCE_ACCOUNTING"
  | "IT_SOFTWARE"
  | "OFFICE_PRODUCTIVITY"
  | "PERSONAL_DEVELOPMENT"
  | "DESIGN"
  | "MARKETING"
  | "HEALTH_FITNESS"
  | "MUSIC"
  | "TEACHING_ACADEMICS"
  | "PHOTOGRAPHY_VIDEO"
  | "LIFESTYLE"
  | "LANGUAGE";

export type CourseItemType = "VIDEO" | "DOCUMENT" | "QUIZ";

export type VideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  prerequisite: string | null;
  level: CourseLevel;
  what_you_will_learn: string[];
  category: CourseCategory;
  material_includes: string[];
  requirements: string[];
  is_free: boolean;
  price: number | null;
  thumbnail_url: string | null;
  instructor_id: string;
  is_published: boolean;
  is_exclusive: boolean;
}

export interface FeaturedCourse extends Course {
  is_featured: boolean;
  featured_order: number;
  is_enrolled: boolean;
  has_access: boolean;
}

export interface CourseVideo {
  status: VideoStatus;
  playback_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  bunny_video_guid?: string;
}

export interface CourseDocument {
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  is_uploaded: boolean;
  storage_key?: string;
}

export interface CourseQuizOption {
  id: string;
  text: string;
  order_index: number;
  is_correct?: boolean;
}

export interface CourseQuizQuestion {
  id: string;
  text: string;
  order_index: number;
  allow_multiple_answers: boolean;
  options: CourseQuizOption[];
}

export interface CourseQuiz {
  id: string;
  title: string;
  description: string;
  passing_score_percentage: number;
  questions: CourseQuizQuestion[];
}

export interface CourseItem {
  id: string;
  title: string;
  item_type: CourseItemType;
  order_index: number;
  is_preview: boolean;
  video: CourseVideo | null;
  document: CourseDocument | null;
  quiz: CourseQuiz | null;
}

export interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  items: CourseItem[];
}

export interface CourseDetail extends Course {
  sections: CourseSection[];
}

// Request payloads

export interface CreateCoursePayload {
  title: string;
  description: string;
  prerequisite: string | null;
  level: CourseLevel;
  what_you_will_learn: string[];
  category: CourseCategory;
  material_includes: string[];
  requirements: string[];
  is_free: boolean;
  price: number | null;
  thumbnail_url: string | null;
  is_exclusive: boolean;
}

export type UpdateCoursePayload = Partial<CreateCoursePayload> & { is_exclusive?: boolean };

export interface CreateSectionPayload {
  title: string;
  order_index: number;
}

export interface UpdateSectionPayload {
  title?: string;
  order_index?: number;
}

export interface ReorderSectionsPayload {
  sections: { id: string; order_index: number }[];
}

export interface CreateItemPayload {
  title: string;
  item_type: CourseItemType;
  order_index: number;
  is_preview: boolean;
  file_name: string | null;
}

export interface UpdateItemPayload {
  title?: string;
  order_index?: number;
  is_preview?: boolean;
}

export interface ReorderItemsPayload {
  items: { id: string; order_index: number }[];
}

export interface VideoUploadCredentials {
  tus_endpoint: string;
  library_id: string;
  video_id: string;
  authorization_signature: string;
  authorization_expire: number;
}

export interface DocumentUploadCredentials {
  upload_url: string;
  storage_key: string;
}

export interface CreateItemResult extends CourseItem {
  video_upload: VideoUploadCredentials | null;
  document_upload: DocumentUploadCredentials | null;
}

export interface FinalizeDocumentPayload {
  mime_type: string;
  file_size_bytes: number;
}

export interface CreateQuizOptionPayload {
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface CreateQuizQuestionPayload {
  text: string;
  order_index: number;
  allow_multiple_answers: boolean;
  options: CreateQuizOptionPayload[];
}

export interface UpdateQuizQuestionPayload {
  text?: string;
  order_index?: number;
  allow_multiple_answers?: boolean;
}

export interface UpdateQuizOptionPayload {
  text?: string;
  is_correct?: boolean;
  order_index?: number;
}

export interface ManagedCourseListParams {
  page?: number;
  page_size?: number;
  category?: CourseCategory;
  level?: CourseLevel;
  is_free?: boolean;
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

/** Payload for PUT /courses/featured */
export interface SetFeaturedCoursesPayload {
  course_ids: string[];
}

/** Response from GET /courses/featured (flat pagination, not ApiEnvelope) */
export interface FeaturedCoursesResponse {
  items: FeaturedCourse[] | null;
  total_items: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CourseCatalog {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  categories: CourseCategory[];
  icon_name?: string | null;
  description?: string | null;
  total_courses?: number;
}

export interface CreateCatalogPayload {
  name: string;
  categories: CourseCategory[];
  icon_name?: string;
  description?: string;
}
