import type { TransactionStatus, TransactionType } from "./payments.types";

export interface DashboardUserStats {
  total_users: number;
  students: number;
  instructors: number;
  admins: number;
  suspended: number;
  new_last_7_days: number;
  new_last_30_days: number;
}

export interface DashboardRevenueStats {
  total_all_time: number;
  last_30_days: number;
  last_7_days: number;
  active_subscriptions: number;
}

export interface DashboardCourseStats {
  total: number;
  published: number;
  draft: number;
}

export interface DashboardTopCourse {
  course_id: string;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
  enrollment_count: number;
}

export interface DashboardSupportStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  unassigned_open: number;
}

export interface DashboardReviewStats {
  platform_average_rating: number;
  total_reviews: number;
  pending_reply: number;
}

export interface DashboardContactMessageStats {
  total: number;
  recent_7_days: number;
}

export interface DashboardRecentSignup {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: "USER" | "INSTRUCTOR" | "ADMIN";
  created_at: string;
}

export interface DashboardRecentTransaction {
  id: string;
  reference: string;
  amount: number;
  status: TransactionStatus;
  transaction_type: TransactionType;
  user_id: string;
  user_name?: string | null;
  created_at: string;
}

export interface AdminDashboardOverview {
  users: DashboardUserStats;
  revenue: DashboardRevenueStats;
  courses: DashboardCourseStats;
  top_enrolled_courses: DashboardTopCourse[];
  support: DashboardSupportStats;
  reviews: DashboardReviewStats;
  contact_messages: DashboardContactMessageStats;
  active_coupons: number;
  certificates_issued_total: number;
  certificates_issued_last_30_days: number;
  recent_signups: DashboardRecentSignup[];
  recent_transactions: DashboardRecentTransaction[];
}
