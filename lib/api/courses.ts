import { apiClient, ApiEnvelope } from "./client";
import type {
  Course,
  CourseDetail,
  CourseQuizOption,
  CourseQuizQuestion,
  CourseQuizGroupSection,
  CourseSection,
  CourseCatalog,
  CreateCatalogPayload,
  CreateCoursePayload,
  CreateItemPayload,
  CreateItemResult,
  CreateQuizOptionPayload,
  CreateQuizQuestionPayload,
  CreateQuizGroupSectionPayload,
  CreateSectionPayload,
  EssaySubmission,
  FeaturedCourse,
  FeaturedCoursesResponse,
  FinalizeDocumentPayload,
  GradeEssayPayload,
  ManagedCourseListParams,
  PaginatedResult,
  ReorderItemsPayload,
  ReorderSectionsPayload,
  SetFeaturedCoursesPayload,
  UpdateAssessmentPayload,
  UpdateCoursePayload,
  UpdateItemPayload,
  UpdateQuizGroupSectionPayload,
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

export async function updateAssessmentSettings(
  itemId: string,
  payload: UpdateAssessmentPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/items/${itemId}/assessment`, payload, { token });
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

export async function createQuizGroupSection(
  itemId: string,
  payload: CreateQuizGroupSectionPayload,
  token: string
): Promise<CourseQuizGroupSection> {
  const res = await apiClient.post<ApiEnvelope<CourseQuizGroupSection>>(
    `/courses/items/${itemId}/quiz-group/sections`,
    payload,
    { token }
  );
  return res.data;
}

export async function updateQuizGroupSection(
  sectionId: string,
  payload: UpdateQuizGroupSectionPayload,
  token: string
): Promise<void> {
  await apiClient.patch(`/courses/quiz-group/sections/${sectionId}`, payload, { token });
}

export async function deleteQuizGroupSection(sectionId: string, token: string): Promise<void> {
  await apiClient.delete(`/courses/quiz-group/sections/${sectionId}`, { token });
}

export async function createQuizGroupSectionQuestion(
  sectionId: string,
  payload: CreateQuizQuestionPayload,
  token: string
): Promise<CourseQuizQuestion> {
  const res = await apiClient.post<ApiEnvelope<CourseQuizQuestion>>(
    `/courses/quiz-group/sections/${sectionId}/questions`,
    payload,
    { token }
  );
  return res.data;
}

export async function listEssaySubmissions(
  itemId: string,
  params: { page?: number; page_size?: number },
  token: string
): Promise<PaginatedResult<EssaySubmission>> {
  const res = await apiClient.get<ApiEnvelope<EssaySubmission[]>>(
    `/courses/items/${itemId}/essay/submissions${buildQuery(params)}`,
    { token }
  );
  return { items: res.data, meta: res.meta! };
}

export async function gradeEssaySubmission(
  itemId: string,
  userId: string,
  payload: GradeEssayPayload,
  token: string
): Promise<void> {
  await apiClient.post(`/courses/items/${itemId}/essay/submissions/${userId}/grade`, payload, { token });
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
  // Backend returns a standard ApiEnvelope: courses in .data, pagination in .meta
  const res = await apiClient.get<ApiEnvelope<FeaturedCourse[]>>(path, token ? { token } : undefined);
  return {
    items: res.data ?? [],
    total_items: res.meta?.total_items ?? 0,
    page: res.meta?.page ?? 1,
    limit: res.meta?.page_size ?? 50,
    total_pages: res.meta?.total_pages ?? 1,
  };
}

export async function setFeaturedCourses(
  payload: SetFeaturedCoursesPayload,
  token: string
): Promise<void> {
  await apiClient.put<ApiEnvelope<null>>("/courses/featured", payload, { token });
}

export async function getCatalogs(token?: string): Promise<CourseCatalog[]> {
  const res = await apiClient.get<ApiEnvelope<CourseCatalog[]>>("/courses/catalogs", token ? { token } : undefined);
  return res.data ?? [];
}
