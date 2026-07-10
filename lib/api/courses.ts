import { apiClient, ApiEnvelope } from "./client";
import type {
  Course,
  CourseDetail,
  CourseQuizOption,
  CourseQuizQuestion,
  CourseSection,
  CreateCoursePayload,
  CreateItemPayload,
  CreateItemResult,
  CreateQuizOptionPayload,
  CreateQuizQuestionPayload,
  CreateSectionPayload,
  FeaturedCoursesResponse,
  FinalizeDocumentPayload,
  ManagedCourseListParams,
  PaginatedResult,
  ReorderItemsPayload,
  ReorderSectionsPayload,
  SetFeaturedCoursesPayload,
  UpdateCoursePayload,
  UpdateItemPayload,
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

export async function createCourse(payload: CreateCoursePayload, token: string): Promise<Course> {
  const res = await apiClient.post<ApiEnvelope<Course>>("/courses", payload, { token });
  return res.data;
}

export async function listManagedCourses(
  params: ManagedCourseListParams,
  token: string
): Promise<PaginatedResult<Course>> {
  const res = await apiClient.get<ApiEnvelope<Course[]>>(`/courses/manage${buildQuery(params)}`, {
    token,
  });
  return { items: res.data, meta: res.meta! };
}

export async function getManagedCourse(id: string, token: string): Promise<CourseDetail> {
  const res = await apiClient.get<ApiEnvelope<CourseDetail>>(`/courses/manage/${id}`, { token });
  return res.data;
}

export async function updateCourse(
  id: string,
  payload: UpdateCoursePayload,
  token: string
): Promise<Course> {
  const res = await apiClient.patch<ApiEnvelope<Course>>(`/courses/${id}`, payload, { token });
  return res.data;
}

export async function publishCourse(
  id: string,
  isPublished: boolean,
  token: string
): Promise<Course> {
  const res = await apiClient.patch<ApiEnvelope<Course>>(
    `/courses/${id}/publish?is_published=${isPublished}`,
    undefined,
    { token }
  );
  return res.data;
}

export async function deleteCourse(id: string, token: string): Promise<void> {
  await apiClient.delete(`/courses/${id}`, { token });
}

export async function createSection(
  courseId: string,
  payload: CreateSectionPayload,
  token: string
): Promise<CourseSection> {
  const res = await apiClient.post<ApiEnvelope<CourseSection>>(
    `/courses/${courseId}/sections`,
    payload,
    { token }
  );
  return res.data;
}

export async function reorderSections(
  courseId: string,
  payload: ReorderSectionsPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/${courseId}/sections/reorder`, payload, { token });
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  payload: UpdateSectionPayload,
  token: string
): Promise<CourseSection> {
  const res = await apiClient.patch<ApiEnvelope<CourseSection>>(
    `/courses/${courseId}/sections/${sectionId}`,
    payload,
    { token }
  );
  return res.data;
}

export async function deleteSection(
  courseId: string,
  sectionId: string,
  token: string
): Promise<void> {
  await apiClient.delete(`/courses/${courseId}/sections/${sectionId}`, { token });
}

export async function createItem(
  courseId: string,
  sectionId: string,
  payload: CreateItemPayload,
  token: string
): Promise<CreateItemResult> {
  const res = await apiClient.post<ApiEnvelope<CreateItemResult>>(
    `/courses/${courseId}/sections/${sectionId}/items`,
    payload,
    { token }
  );
  return res.data;
}

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/items/${itemId}`, payload, { token });
}

export async function deleteItem(itemId: string, token: string): Promise<void> {
  await apiClient.delete(`/courses/items/${itemId}`, { token });
}

export async function reorderItems(
  courseId: string,
  sectionId: string,
  payload: ReorderItemsPayload,
  token: string
): Promise<void> {
  await apiClient.patch(
    `/courses/${courseId}/sections/${sectionId}/items/reorder`,
    payload,
    { token }
  );
}

export async function refreshVideoUpload(
  itemId: string,
  token: string
): Promise<VideoUploadCredentials> {
  const res = await apiClient.post<ApiEnvelope<VideoUploadCredentials>>(
    `/courses/items/${itemId}/video/refresh-upload`,
    undefined,
    { token }
  );
  return res.data;
}

export async function finalizeDocument(
  itemId: string,
  payload: FinalizeDocumentPayload,
  token: string
): Promise<void> {
  await apiClient.post(`/courses/items/${itemId}/document/finalize`, payload, { token });
}

export async function createQuizQuestion(
  itemId: string,
  payload: CreateQuizQuestionPayload,
  token: string
): Promise<CourseQuizQuestion> {
  const res = await apiClient.post<ApiEnvelope<CourseQuizQuestion>>(
    `/courses/items/${itemId}/quiz/questions`,
    payload,
    { token }
  );
  return res.data;
}

export async function addQuizOption(
  questionId: string,
  payload: CreateQuizOptionPayload,
  token: string
): Promise<CourseQuizOption> {
  const res = await apiClient.post<ApiEnvelope<CourseQuizOption>>(
    `/courses/quiz/questions/${questionId}/options`,
    payload,
    { token }
  );
  return res.data;
}

export async function updateQuizQuestion(
  questionId: string,
  payload: UpdateQuizQuestionPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/quiz/questions/${questionId}`, payload, { token });
}

export async function updateQuizOption(
  optionId: string,
  payload: UpdateQuizOptionPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/quiz/options/${optionId}`, payload, { token });
}

export async function deleteQuizQuestion(questionId: string, token: string): Promise<void> {
  await apiClient.delete(`/courses/quiz/questions/${questionId}`, { token });
}

export async function deleteQuizOption(optionId: string, token: string): Promise<void> {
  await apiClient.delete(`/courses/quiz/options/${optionId}`, { token });
}

export async function getFeaturedCourses(
  params: { page?: number; limit?: number },
  token?: string
): Promise<FeaturedCoursesResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  const path = `/courses/featured${qs ? `?${qs}` : ""}`;
  return apiClient.get<FeaturedCoursesResponse>(path, token ? { token } : undefined);
}

export async function setFeaturedCourses(
  payload: SetFeaturedCoursesPayload,
  token: string
): Promise<void> {
  await apiClient.put<ApiEnvelope<null>>("/courses/featured", payload, { token });
}
