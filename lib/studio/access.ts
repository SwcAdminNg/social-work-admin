// The signed-in user's `access` object from GET /users/me (shared with the instructor app).

export type AccessCapabilities = {
  can_create_courses?: boolean;
  can_edit_content?: boolean;
  can_submit_for_review?: boolean;
  can_review_content?: boolean;
  can_publish?: boolean;
  can_archive?: boolean;
  can_mark_essays?: boolean;
  can_moderate_marks?: boolean;
  can_approve_results?: boolean;
  can_force_approve?: boolean;
  can_manage_staff_roles?: boolean;
  can_view_audit_log?: boolean;
  can_access_approval_centre?: boolean;
};

export type UserAccess = {
  governance_enabled?: boolean;
  roles?: { role?: string; course_id?: string | null; implicit?: boolean; assignment_id?: string }[];
  permissions?: string[];
  owned_course_count?: number;
  owned_course_permissions?: string[];
  course_access?: { course_id?: string; course_title?: string; roles?: string[]; permissions?: string[] }[];
  capabilities?: AccessCapabilities;
};
