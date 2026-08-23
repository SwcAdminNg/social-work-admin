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

export type CourseItemType = "VIDEO" | "DOCUMENT" | "ASSESSMENT";

export type AssessmentType = "QUIZ" | "ESSAY" | "QUIZ_GROUP";
export type EssaySubmissionMode = "TEXT" | "DOCUMENT";

export type VideoStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type AccessMode = "SELF_PACED" | "SCHEDULED";

export interface CourseInstructorReadDTO {
  user_id: string | null;
  name: string;
}

export interface CourseInstructorInputDTO {
  user_id?: string | null;
  name: string;
}


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
  average_rating?: number;
  total_reviews?: number;
  access_mode: AccessMode;
  access_start_date: string | null;
  access_end_date: string | null;
  instructors: CourseInstructorReadDTO[];
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
  multi_answer_mode?: "AND" | "OR" | null;
  options: CourseQuizOption[];
}

export interface CourseQuizSettings {
  max_attempts: number | null;
  pass_mark_percentage: number;
  show_result_to_student: boolean;
  questions: CourseQuizQuestion[];
}

export interface CourseEssaySettings {
  question: string;
  description: string;
  submission_mode: EssaySubmissionMode;
}

export interface CourseQuizGroupSection {
  id: string;
  title: string;
  order_index: number;
  questions_to_ask: number | null;
  questions: CourseQuizQuestion[];
}

export interface CourseQuizGroupSettings {
  max_attempts: number | null;
  pass_mark_percentage: number;
  show_result_to_student: boolean;
  time_limit_seconds: number | null;
  sections: CourseQuizGroupSection[];
}

export interface CourseAssessment {
  id: string;
  assessment_type: AssessmentType;
  due_date: string | null;
  quiz?: CourseQuizSettings;
  essay?: CourseEssaySettings;
  quiz_group?: CourseQuizGroupSettings;
}

export interface CourseItem {
  id: string;
  title: string;
  item_type: CourseItemType;
  order_index: number;
  is_preview: boolean;
  estimated_minutes: number | null;
  video: CourseVideo | null;
  document: CourseDocument | null;
  assessment: CourseAssessment | null;
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
  instructors?: CourseInstructorInputDTO[];
  access_mode?: AccessMode;
  access_start_date?: string | null;
  access_end_date?: string | null;
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
  estimated_minutes?: number | null;
  file_name?: string | null;
  assessment_type?: AssessmentType;
  due_date?: string | null;
  quiz_settings?: Partial<Omit<CourseQuizSettings, "questions">>;
  essay_settings?: CourseEssaySettings;
  quiz_group_settings?: Partial<Omit<CourseQuizGroupSettings, "sections">>;
}

export interface UpdateItemPayload {
  title?: string;
  order_index?: number;
  is_preview?: boolean;
  estimated_minutes?: number | null;
}

export interface UpdateAssessmentPayload {
  due_date?: string | null;
  quiz_settings?: Partial<Omit<CourseQuizSettings, "questions">> | null;
  essay_settings?: Partial<CourseEssaySettings> | null;
  quiz_group_settings?: Partial<Omit<CourseQuizGroupSettings, "sections">> | null;
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
  multi_answer_mode?: "AND" | "OR" | null;
  options: CreateQuizOptionPayload[];
}

export interface UpdateQuizQuestionPayload {
  text?: string;
  order_index?: number;
  allow_multiple_answers?: boolean;
  multi_answer_mode?: "AND" | "OR" | null;
}

export interface UpdateQuizOptionPayload {
  text?: string;
  is_correct?: boolean;
  order_index?: number;
}

export interface CreateQuizGroupSectionPayload {
  title: string;
  order_index?: number;
  questions_to_ask?: number | null;
}

export interface UpdateQuizGroupSectionPayload {
  title?: string;
  order_index?: number;
  questions_to_ask?: number | null;
}

export interface EssaySubmission {
  user_id: string;
  user_full_name: string;
  user_email: string;
  content_text: string | null;
  document_file_name: string | null;
  document_download_url: string | null;
  submitted_at: string;
  score: number | null;
  is_published: boolean;
  feedback: string | null;
}

export interface GradeEssayPayload {
  score: number;
  feedback?: string | null;
  is_published?: boolean;
}

export interface ManagedCourseListParams {
  page?: number;
  page_size?: number;
  category?: CourseCategory;
  level?: CourseLevel;
  is_free?: boolean;
  search?: string;
  is_published?: boolean;
  instructor_id?: string;
  instructor_name?: string;
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

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_hidden: boolean;
  reply_text: string | null;
  reply_created_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    [key: string]: any;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface ReplyToReviewPayload {
  reply_text: string;
}

export interface HideReviewPayload {
  is_hidden: boolean;
}
