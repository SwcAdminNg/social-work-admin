export type NotificationType =
  // Back-office types — fan out to every active admin
  | "NEW_USER_SIGNUP"
  | "NEW_PAYMENT"
  | "NEW_CONTACT_MESSAGE"
  | "NEW_SUPPORT_TICKET"
  | "NEW_COURSE_REVIEW"
  | "ADMIN_INVITE_ACCEPTED"
  // Directed to one specific admin
  | "ADMIN_INVITED"
  | "SUPPORT_TICKET_ASSIGNED"
  | "SUPPORT_TICKET_MESSAGE"
  // Account-level types
  | "LOGIN"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_COMPLETED"
  | "PROFILE_PICTURE_UPDATED"
  | "TWO_FACTOR_ENABLED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_UNSUSPENDED"
  | "ROLE_CHANGED";

export interface Notification {
  id: string;
  created_at: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata_json?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
}

export interface GetNotificationsParams {
  unread_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface UnreadCount {
  count: number;
}

export type NotificationSocketEvent = { type: "notification"; data: Notification };
