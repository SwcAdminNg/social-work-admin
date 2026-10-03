import type { CourseDetail, PaginatedMeta } from "./courses.types";

export type GovernanceRole =
  | "INSTRUCTOR"
  | "CONTENT_DEVELOPER"
  | "ACADEMIC_REVIEWER"
  | "ASSESSMENT_MODERATOR"
  | "QA_REVIEWER"
  | "COURSE_LEAD"
  | "LEAD_ASSESSOR"
  | "HEAD_OF_LEARNING"
  | "PLATFORM_ADMIN";

export type GovernancePermission =
  | "CREATE_CONTENT"
  | "EDIT_DRAFT_CONTENT"
  | "SUBMIT_FOR_REVIEW"
  | "ACADEMIC_REVIEW"
  | "MODERATE_ASSESSMENT"
  | "QA_REVIEW"
  | "APPROVE_COURSE"
  | "MARK_ASSESSMENT"
  | "APPROVE_RESULTS"
  | "FINAL_APPROVAL"
  | "FORCE_APPROVE"
  | "PUBLISH_CONTENT"
  | "ARCHIVE_CONTENT"
  | "MANAGE_STAFF_ROLES";

export type RevisionStatus =
  | "DRAFT"
  | "SUBMITTED_FOR_REVIEW"
  | "ACADEMIC_REVIEW"
  | "ACADEMICALLY_APPROVED"
  | "ASSESSMENT_MODERATION"
  | "QA_REVIEW"
  | "QA_APPROVED"
  | "COURSE_APPROVED"
  | "FINAL_APPROVAL_REQUIRED"
  | "READY_TO_PUBLISH"
  | "PUBLISHED"
  | "RETURNED_FOR_REVISION"
  | "REJECTED"
  | "WITHDRAWN";

export type RevisionAction =
  | "EDIT"
  | "DISCARD"
  | "SUBMIT"
  | "WITHDRAW"
  | "CLAIM"
  | "APPROVE"
  | "APPROVE_WITH_MINOR_CHANGES"
  | "RETURN_FOR_REVISION"
  | "REJECT"
  | "ESCALATE"
  | "ASSIGN_REVIEWER"
  | "FORCE_APPROVE"
  | "OVERRIDE_RISK"
  | "PUBLISH"
  | "COMMENT"
  | "ATTACH_EVIDENCE";

export type DecisionValue =
  | "APPROVED"
  | "APPROVED_WITH_MINOR_CHANGES"
  | "RETURNED_FOR_REVISION"
  | "REJECTED"
  | "ESCALATED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ApprovalCentreView =
  | "awaiting_me"
  | "returned_to_me"
  | "overdue"
  | "ready_to_publish"
  | "recently_approved"
  | "recently_rejected"
  | "my_drafts";

export type ApprovalItemKind = "COURSE_REVISION" | "ESSAY_MARK";

export interface PersonRef {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface StaffRoleAssignment {
  id: string;
  assignment_id?: string;
  user_id: string;
  user?: PersonRef | null;
  role: GovernanceRole;
  course_id?: string | null;
  course?: { id: string; title: string } | null;
  reason?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  revoke_reason?: string | null;
  granted_by_user?: PersonRef | null;
  created_at?: string | null;
  granted_at?: string | null;
  implicit?: boolean;
}

export type StaffRoleStatus = "ACTIVE" | "REVOKED" | "ALL";

/** One person with every grant they hold (GET /admin/staff-roles/members). */
export interface StaffMemberRoles {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    user_type: string;
    profile_picture_url?: string | null;
  };
  roles: StaffRoleAssignment[];
  active_role_count: number;
  platform_role_count: number;
  course_count: number;
}

export interface PermissionSummary {
  course_id?: string | null;
  governance_enabled: boolean;
  roles: StaffRoleAssignment[];
  permissions: GovernancePermission[];
}

export interface ApprovalCentreCounts {
  awaiting_me: number;
  returned_to_me: number;
  overdue: number;
  ready_to_publish: number;
}

export interface ApprovalCentreRow {
  kind: ApprovalItemKind;
  id: string;
  item_title: string;
  item_type: string;
  course_id?: string | null;
  course_title?: string | null;
  submitted_by?: PersonRef | null;
  current_stage?: string | null;
  status: string;
  reviewer?: PersonRef | null;
  due_at?: string | null;
  is_overdue?: boolean;
  risk?: RiskLevel | null;
  version_label?: string | null;
  decision?: string | null;
  available_actions?: string[];
}

export interface RevisionStage {
  id?: string;
  stage: string;
  status?: string | null;
  reviewer?: PersonRef | null;
  assigned_to?: PersonRef | null;
  due_at?: string | null;
  decided_at?: string | null;
  decision?: string | null;
  is_overdue?: boolean;
  round?: number;
  comment?: string | null;
}

export interface GovernanceRevision {
  id: string;
  course_id: string;
  course_title?: string | null;
  kind: string;
  status: RevisionStatus | string;
  current_stage?: string | null;
  risk?: RiskLevel | null;
  risk_level?: RiskLevel | null;
  risk_reasons?: string[];
  proposed_version_label?: string | null;
  current_version_label?: string | null;
  change_summary?: string | null;
  reason?: string | null;
  stages?: RevisionStage[];
  contributors?: PersonRef[];
  open_conditions?: string[];
  available_actions?: RevisionAction[];
  blocked_reason?: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
}

export interface RevisionDiffChange {
  entity: string;
  key?: string;
  op: "ADDED" | "REMOVED" | "MODIFIED" | "MOVED" | string;
  label: string;
  fields?: string[];
  before?: unknown;
  after?: unknown;
  item_type?: string | null;
  risk?: RiskLevel | null;
}

export interface RevisionComment {
  id: string;
  body: string;
  author?: PersonRef | null;
  parent_id?: string | null;
  anchor_type?: string | null;
  anchor_id?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface RevisionEvidence {
  id: string;
  title: string;
  file_name?: string | null;
  url?: string | null;
  download_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  created_at?: string | null;
}

export interface CourseGovernanceSummary {
  governance_enabled: boolean;
  lifecycle: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  current_version_label?: string | null;
  layer?: "auto" | "live" | "draft" | string;
  open_revision?: {
    id: string;
    kind: string;
    status: string;
    round?: number;
    is_editable?: boolean;
  } | null;
}

export interface CourseVersion {
  id: string;
  label?: string | null;
  version_label?: string | null;
  author?: PersonRef | null;
  reviewers?: PersonRef[];
  approved_at?: string | null;
  published_at?: string | null;
  published_by?: PersonRef | null;
  reason?: string | null;
  risk_level?: RiskLevel | null;
  is_current?: boolean;
  has_snapshot?: boolean;
}

export interface CourseVersionDetail extends CourseVersion {
  snapshot?: unknown;
}

export type MarkAction =
  | "EDIT"
  | "SUBMIT_FOR_MODERATION"
  | "MODERATE"
  | "DISPUTE"
  | "APPROVE"
  | "PUBLISH";

export interface EssayMark {
  id: string;
  item_id?: string;
  course_id?: string;
  course_title?: string | null;
  user_id?: string;
  student?: PersonRef | null;
  marker?: PersonRef | null;
  moderator?: PersonRef | null;
  approver?: PersonRef | null;
  status: string;
  score?: number | null;
  feedback?: string | null;
  moderated_score?: number | null;
  moderated_feedback?: string | null;
  final_score?: number | null;
  final_feedback?: string | null;
  recommendation?: "PASS" | "FAIL" | null;
  available_actions?: MarkAction[];
  history?: unknown[];
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export type RevisionTree = CourseDetail;
