import { ApiError, type ApiEnvelope } from "./client";
import type {
  ApprovalCentreCounts,
  ApprovalCentreRow,
  ApprovalCentreView,
  CourseGovernanceSummary,
  CourseVersion,
  CourseVersionDetail,
  DecisionValue,
  EssayMark,
  GovernanceRevision,
  GovernanceRole,
  PaginatedResult,
  PermissionSummary,
  RevisionComment,
  RevisionDiffChange,
  RevisionEvidence,
  RevisionTree,
  RiskLevel,
  StaffRoleAssignment,
} from "./governance.types";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
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

/**
 * Normalise a list response. Some governance endpoints return no `meta` (or wrap the list),
 * so never trust `res.meta` / `res.data` to be present — callers read `meta.total_pages`.
 */
function toPaginated<T>(res: ApiEnvelope<T[]> | null, page: number, pageSize: number): PaginatedResult<T> {
  const raw = res?.data as unknown;
  const items: T[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: T[] }).items
      : [];
  const meta = res?.meta;
  return {
    items,
    meta: {
      page: meta?.page ?? page,
      page_size: meta?.page_size ?? pageSize,
      total_items: meta?.total_items ?? items.length,
      total_pages: meta?.total_pages ?? 1,
      has_next: meta?.has_next ?? false,
      has_previous: meta?.has_previous ?? page > 1,
    },
  };
}

export async function getMyGovernancePermissions(courseId?: string): Promise<PermissionSummary> {
  const res = await request<PermissionSummary>(
    `/api/governance/me/permissions${buildQuery({ course_id: courseId })}`,
  );
  return res.data;
}

export async function listStaffRoles(params: {
  user_id?: string;
  role?: GovernanceRole | "";
  course_id?: string;
  include_revoked?: boolean;
  page?: number;
  page_size?: number;
} = {}): Promise<PaginatedResult<StaffRoleAssignment>> {
  const query = { page: 1, page_size: 50, ...params };
  const res = await request<StaffRoleAssignment[]>(`/api/admin/staff-roles${buildQuery(query)}`);
  return toPaginated(res, query.page, query.page_size);
}

export async function grantStaffRole(payload: {
  user_id: string;
  role: GovernanceRole;
  course_id?: string | null;
  reason?: string | null;
  expires_at?: string | null;
}): Promise<StaffRoleAssignment> {
  const res = await request<StaffRoleAssignment>("/api/admin/staff-roles", {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function revokeStaffRole(assignmentId: string, reason?: string): Promise<StaffRoleAssignment> {
  const res = await request<StaffRoleAssignment>(`/api/admin/staff-roles/${assignmentId}/revoke`, {
    method: "POST",
    body: { reason: reason?.trim() || undefined },
  });
  return res.data;
}

export async function getApprovalCentreCounts(): Promise<ApprovalCentreCounts> {
  const res = await request<ApprovalCentreCounts>("/api/governance/approval-centre/counts");
  return res.data;
}

export async function listApprovalCentre(params: {
  view?: ApprovalCentreView;
  kind?: "COURSE_REVISION" | "ESSAY_MARK" | "";
  course_id?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResult<ApprovalCentreRow>> {
  const query = { page: 1, page_size: 20, ...params };
  const res = await request<ApprovalCentreRow[]>(`/api/governance/approval-centre${buildQuery(query)}`);
  return toPaginated(res, query.page, query.page_size);
}

export async function getRevision(id: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}`);
  return res.data;
}

export async function getRevisionDiff(id: string): Promise<RevisionDiffChange[]> {
  const res = await request<RevisionDiffChange[]>(`/api/governance/revisions/${id}/diff`);
  return res.data ?? [];
}

export async function getRevisionTree(id: string): Promise<RevisionTree> {
  const res = await request<RevisionTree>(`/api/governance/revisions/${id}/tree`);
  return res.data;
}

export async function getRevisionPreview(id: string): Promise<unknown> {
  const res = await request<unknown>(`/api/governance/revisions/${id}/preview`);
  return res.data;
}

export async function getRevisionComments(id: string): Promise<RevisionComment[]> {
  const res = await request<RevisionComment[]>(`/api/governance/revisions/${id}/comments`);
  return res.data ?? [];
}

export async function addRevisionComment(id: string, body: string): Promise<RevisionComment> {
  const res = await request<RevisionComment>(`/api/governance/revisions/${id}/comments`, {
    method: "POST",
    body: { body },
  });
  return res.data;
}

export async function resolveRevisionComment(id: string): Promise<RevisionComment> {
  const res = await request<RevisionComment>(`/api/governance/comments/${id}/resolve`, {
    method: "PATCH",
    body: {},
  });
  return res.data;
}

export async function getRevisionEvidence(id: string): Promise<RevisionEvidence[]> {
  const res = await request<RevisionEvidence[]>(`/api/governance/revisions/${id}/evidence`);
  return res.data ?? [];
}

export async function addRevisionEvidenceLink(
  id: string,
  payload: { title: string; url: string },
): Promise<RevisionEvidence> {
  const res = await request<RevisionEvidence>(`/api/governance/revisions/${id}/evidence/link`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function claimRevision(id: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/claim`, {
    method: "POST",
    body: {},
  });
  return res.data;
}

export async function assignRevision(id: string, reviewerId: string, dueAt?: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/assign`, {
    method: "POST",
    body: { reviewer_id: reviewerId, due_at: dueAt || undefined },
  });
  return res.data;
}

export async function submitRevision(
  id: string,
  payload: { change_summary: string; reason?: string; declared_risk?: RiskLevel; flags?: string[] },
): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/submit`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function withdrawRevision(id: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/withdraw`, {
    method: "POST",
    body: {},
  });
  return res.data;
}

export async function discardRevision(id: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/discard`, {
    method: "POST",
    body: {},
  });
  return res.data;
}

export async function decideRevision(
  id: string,
  payload: {
    decision: DecisionValue;
    comment?: string;
    conditions?: string[];
    escalate_to?: RiskLevel;
    flags?: string[];
  },
): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/decision`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function forceApproveRevision(id: string, justification: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/force-approve`, {
    method: "POST",
    body: { justification },
  });
  return res.data;
}

export async function overrideRevisionRisk(id: string, level: RiskLevel, reason: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/risk`, {
    method: "POST",
    body: { level, reason },
  });
  return res.data;
}

export async function publishRevision(id: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/governance/revisions/${id}/publish`, {
    method: "POST",
    body: {},
  });
  return res.data;
}

export async function getCourseGovernance(courseId: string): Promise<CourseGovernanceSummary> {
  const res = await request<CourseGovernanceSummary>(`/api/courses/${courseId}/governance`);
  return res.data;
}

export async function openCourseRevision(courseId: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/courses/${courseId}/revisions`, {
    method: "POST",
    body: {},
  });
  return res.data;
}

export async function listCourseVersions(courseId: string): Promise<CourseVersion[]> {
  const res = await request<CourseVersion[]>(`/api/courses/${courseId}/versions`);
  return res.data ?? [];
}

export async function getCourseVersion(courseId: string, versionId: string): Promise<CourseVersionDetail> {
  const res = await request<CourseVersionDetail>(`/api/courses/${courseId}/versions/${versionId}`);
  return res.data;
}

export async function rollbackCourseVersion(courseId: string, versionId: string, reason?: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/courses/${courseId}/versions/${versionId}/rollback`, {
    method: "POST",
    body: { reason: reason?.trim() || undefined },
  });
  return res.data;
}

export async function archiveCourse(courseId: string, reason?: string): Promise<CourseGovernanceSummary> {
  const res = await request<CourseGovernanceSummary>(`/api/courses/${courseId}/archive`, {
    method: "POST",
    body: { reason: reason?.trim() || undefined },
  });
  return res.data;
}

export async function reinstateCourse(courseId: string, reason?: string): Promise<GovernanceRevision> {
  const res = await request<GovernanceRevision>(`/api/courses/${courseId}/reinstate`, {
    method: "POST",
    body: { reason: reason?.trim() || undefined },
  });
  return res.data;
}

export async function getEssayMark(id: string): Promise<EssayMark> {
  const res = await request<EssayMark>(`/api/essay-marks/${id}`);
  return res.data;
}

export async function submitEssayMark(id: string): Promise<EssayMark> {
  const res = await request<EssayMark>(`/api/essay-marks/${id}/submit`, { method: "POST", body: {} });
  return res.data;
}

export async function moderateEssayMark(
  id: string,
  payload: { action: "APPROVE" | "AMEND" | "RETURN"; score?: number; feedback?: string; note?: string },
): Promise<EssayMark> {
  const res = await request<EssayMark>(`/api/essay-marks/${id}/moderate`, { method: "POST", body: payload });
  return res.data;
}

export async function disputeEssayMark(id: string, note: string): Promise<EssayMark> {
  const res = await request<EssayMark>(`/api/essay-marks/${id}/dispute`, { method: "POST", body: { note } });
  return res.data;
}

export async function approveEssayMark(
  id: string,
  payload: { final_score?: number; final_feedback?: string; note?: string; publish?: boolean },
): Promise<EssayMark> {
  const res = await request<EssayMark>(`/api/essay-marks/${id}/approve`, { method: "POST", body: payload });
  return res.data;
}

export async function publishEssayMarks(
  itemId: string,
  payload: { mark_ids?: string[]; all_approved?: boolean },
): Promise<unknown> {
  const res = await request<unknown>(`/api/courses/items/${itemId}/essay-marks/publish`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}
