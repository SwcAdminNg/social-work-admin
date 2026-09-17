export type InstructorApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface InstructorApplicationSummary {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  cv_file_name: string;
  status: InstructorApplicationStatus;
}

/**
 * Also the shape returned by approve/reject/resend-link — those just omit
 * `cv_download_url` (never re-minted on a mutation) and whichever of
 * `user_id`/`rejection_reason` doesn't apply to the outcome.
 */
export interface InstructorApplicationDetail extends InstructorApplicationSummary {
  cv_download_url?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  /** Only present once APPROVED — the instructor account created for them. */
  user_id?: string | null;
  /** Only present once REJECTED — may be null if the admin didn't give a reason. */
  rejection_reason?: string | null;
}

export interface GetInstructorApplicationsParams {
  status?: InstructorApplicationStatus;
  page?: number;
  page_size?: number;
}

export interface ApproveInstructorApplicationPayload {
  platform: "NG" | "COM";
}

export interface RejectInstructorApplicationPayload {
  reason?: string | null;
}
