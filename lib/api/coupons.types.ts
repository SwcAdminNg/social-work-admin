import type { CourseCategory } from "./courses.types";

export type CouponDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface CouponReadDTO {
  id: string;
  code: string;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  max_redemptions_per_user: number;
  times_redeemed: number;
  applicable_course_ids: string[] | null;
  applicable_category: CourseCategory | null;
  new_users_only: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  max_redemptions?: number | null;
  max_redemptions_per_user?: number;
  applicable_course_ids?: string[] | null;
  applicable_category?: CourseCategory | null;
  new_users_only?: boolean;
  is_active?: boolean;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;

export interface PaginatedResponse<T> {
  items: T[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
}
