import { ApiError, type ApiEnvelope } from "./client";
import type {
  Course,
  CourseDetail,
  CourseQuizOption,
  CourseQuizQuestion,
  CourseSection,
  CourseCatalog,
  CourseReview,
  ReplyToReviewPayload,
  HideReviewPayload,
  CreateCatalogPayload,
  CreateCoursePayload,
  CreateItemPayload,
  CreateItemResult,
  CreateQuizOptionPayload,
  CreateQuizQuestionPayload,
  CreateSectionPayload,
  FeaturedCourse,
  FeaturedCoursesResponse,
  FinalizeDocumentPayload,
  ManagedCourseListParams,
  PaginatedResult,
  ReorderItemsPayload,
  ReorderSectionsPayload,
  SetFeaturedCoursesPayload,
  UpdateCoursePayload,
  UpdateItemPayload,
  UpdateAssessmentPayload,
  UpdateQuizOptionPayload,
  UpdateQuizQuestionPayload,
  UpdateSectionPayload,
  VideoUploadCredentials,
} from "./courses.types";

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(
  path: string,
  options: { method: string; body?: unknown } = { method: "GET" },
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`/api/courses${path}`, {
    method: options.method,
    headers:
      options.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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

  return payload as ApiEnvelope<T>;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<Course> {
  const res = await request<Course>("", { method: "POST", body: payload });
  return res.data;
}

export async function listManagedCourses(
  params: ManagedCourseListParams,
): Promise<PaginatedResult<Course>> {
  const res = await request<Course[]>(`/manage${buildQuery(params)}`, {
    method: "GET",
  });
  return { items: res.data, meta: res.meta! };
}

export async function getManagedCourse(id: string): Promise<CourseDetail> {
  const res = await request<CourseDetail>(`/manage/${id}`, { method: "GET" });
  return res.data;
}

export async function updateCourse(
  id: string,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const res = await request<Course>(`/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return res.data;
}

export async function publishCourse(
  id: string,
  isPublished: boolean,
): Promise<Course> {
  const res = await request<Course>(
    `/${id}/publish?is_published=${isPublished}`,
    {
      method: "PATCH",
    },
  );
  return res.data;
}

export async function deleteCourse(id: string): Promise<void> {
  await request(`/${id}`, { method: "DELETE" });
}

export async function createSection(
  courseId: string,
  payload: CreateSectionPayload,
): Promise<CourseSection> {
  const res = await request<CourseSection>(`/${courseId}/sections`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function reorderSections(
  courseId: string,
  payload: ReorderSectionsPayload,
): Promise<void> {
  await request(`/${courseId}/sections/reorder`, {
    method: "PATCH",
    body: payload,
  });
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  payload: UpdateSectionPayload,
): Promise<CourseSection> {
  const res = await request<CourseSection>(
    `/${courseId}/sections/${sectionId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return res.data;
}

export async function deleteSection(
  courseId: string,
  sectionId: string,
): Promise<void> {
  await request(`/${courseId}/sections/${sectionId}`, { method: "DELETE" });
}

export async function createItem(
  courseId: string,
  sectionId: string,
  payload: CreateItemPayload,
): Promise<CreateItemResult> {
  const res = await request<CreateItemResult>(
    `/${courseId}/sections/${sectionId}/items`,
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
): Promise<void> {
  await request(`/items/${itemId}`, { method: "PATCH", body: payload });
}

export async function updateAssessmentSettings(
  itemId: string,
  payload: UpdateAssessmentPayload,
): Promise<void> {
  await request(`/items/${itemId}/assessment`, { method: "PATCH", body: payload });
}

export async function deleteItem(itemId: string): Promise<void> {
  await request(`/items/${itemId}`, { method: "DELETE" });
}

export async function reorderItems(
  courseId: string,
  sectionId: string,
  payload: ReorderItemsPayload,
): Promise<void> {
  await request(`/${courseId}/sections/${sectionId}/items/reorder`, {
    method: "PATCH",
    body: payload,
  });
}

export async function refreshVideoUpload(
  itemId: string,
): Promise<VideoUploadCredentials> {
  const res = await request<VideoUploadCredentials>(
    `/items/${itemId}/video/refresh-upload`,
    {
      method: "POST",
    },
  );
  return res.data;
}

export async function finalizeDocument(
  itemId: string,
  payload: FinalizeDocumentPayload,
): Promise<void> {
  await request(`/items/${itemId}/document/finalize`, {
    method: "POST",
    body: payload,
  });
}

export async function createQuizQuestion(
  itemId: string,
  payload: CreateQuizQuestionPayload,
): Promise<CourseQuizQuestion> {
  const res = await request<CourseQuizQuestion>(
    `/items/${itemId}/quiz/questions`,
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function addQuizOption(
  questionId: string,
  payload: CreateQuizOptionPayload,
): Promise<CourseQuizOption> {
  const res = await request<CourseQuizOption>(
    `/quiz/questions/${questionId}/options`,
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function updateQuizQuestion(
  questionId: string,
  payload: UpdateQuizQuestionPayload,
): Promise<void> {
  await request(`/quiz/questions/${questionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function updateQuizOption(
  optionId: string,
  payload: UpdateQuizOptionPayload,
): Promise<void> {
  await request(`/quiz/options/${optionId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  await request(`/quiz/questions/${questionId}`, { method: "DELETE" });
}

export async function deleteQuizOption(optionId: string): Promise<void> {
  await request(`/quiz/options/${optionId}`, { method: "DELETE" });
}

export async function getThumbnailUploadUrl(
  courseId: string,
  payload: { file_name: string; content_type: string },
): Promise<{ upload_url: string; thumbnail_url: string }> {
  const res = await request<{ upload_url: string; thumbnail_url: string }>(
    `/manage/${courseId}/thumbnail-upload-url`,
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function getFeaturedCourses(
  params: { page?: number; limit?: number } = {},
): Promise<FeaturedCoursesResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  const res = await fetch(`/api/courses/featured${qs ? `?${qs}` : ""}`);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, payload);
  }
  
  const envelope = payload as ApiEnvelope<FeaturedCourse[]>;
  return {
    items: envelope.data ?? [],
    total_items: envelope.meta?.total_items ?? 0,
    page: envelope.meta?.page ?? 1,
    limit: envelope.meta?.page_size ?? 50,
    total_pages: envelope.meta?.total_pages ?? 1,
  };
}

export async function setFeaturedCourses(
  payload: SetFeaturedCoursesPayload,
): Promise<void> {
  const res = await fetch(`/api/courses/featured`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, data);
  }
}

export async function getCatalogs(): Promise<CourseCatalog[]> {
  const res = await fetch(`/api/courses/catalogs`);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, payload);
  }
  const envelope = payload as ApiEnvelope<CourseCatalog[]>;
  return envelope.data ?? [];
}

export async function createCatalog(payload: CreateCatalogPayload): Promise<CourseCatalog> {
  const res = await fetch(`/api/courses/catalogs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : res.statusText;
    throw new ApiError(message, res.status, data);
  }
  const envelope = data as ApiEnvelope<CourseCatalog>;
  return envelope.data;
}

// Course Reviews

export async function createCourseReview(
  courseId: string,
  payload: { rating: number; review_text?: string }
): Promise<CourseReview> {
  const res = await request<CourseReview>(`/${courseId}/reviews`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function getCurrentUserReview(
  courseId: string
): Promise<CourseReview> {
  const res = await request<CourseReview>(`/${courseId}/reviews/me`, {
    method: "GET",
  });
  return res.data;
}

export async function getCourseReviews(
  courseId: string,
  params: { page?: number; limit?: number } = {}
): Promise<PaginatedResult<CourseReview>> {
  const res = await request<CourseReview[]>(`/${courseId}/reviews${buildQuery(params)}`, {
    method: "GET",
  });
  return { items: res.data, meta: res.meta! };
}

export async function getAllReviews(
  params: { page?: number; limit?: number } = {}
): Promise<PaginatedResult<CourseReview>> {
  const res = await request<CourseReview[]>(`/reviews/all${buildQuery(params)}`, {
    method: "GET",
  });
  return { items: res.data, meta: res.meta! };
}

export async function updateCourseReview(
  reviewId: string,
  payload: { rating?: number; review_text?: string }
): Promise<CourseReview> {
  const res = await request<CourseReview>(`/reviews/${reviewId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function deleteCourseReview(reviewId: string): Promise<void> {
  await request(`/reviews/${reviewId}`, { method: "DELETE" });
}

export async function replyToCourseReview(
  reviewId: string,
  payload: ReplyToReviewPayload
): Promise<CourseReview> {
  const res = await request<CourseReview>(`/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: payload,
  });
  return res.data;
}

export async function hideCourseReview(
  reviewId: string,
  payload: HideReviewPayload
): Promise<CourseReview> {
  const res = await request<CourseReview>(`/reviews/${reviewId}/hide`, {
    method: "PATCH",
    body: payload,
  });
  return res.data;
}
