export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED";
export type TransactionType = "COURSE_PURCHASE" | "SUBSCRIPTION" | "DONATION" | string;

export interface TransactionReadDTO {
  id: string;
  user_id: string;
  amount: number;
  reference: string;
  gateway: string;
  status: TransactionStatus;
  transaction_type: TransactionType;
  related_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  is_free_trial: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionPlanPayload {
  name: string;
  description: string;
  duration_days: number;
  price: number;
  is_free_trial: boolean;
}

export interface UpdateSubscriptionPlanPayload {
  name?: string;
  description?: string;
  duration_days?: number;
  price?: number;
  is_free_trial?: boolean;
  is_active?: boolean;
}

export interface SavedCardResponse {
  id: string;
  gateway: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  card_type: string;
  bank: string | null;
}

export interface UserReadDTO {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
}

export interface CourseTransactionReadDTO {
  id: string;
  amount: number;
  status: TransactionStatus;
  transaction_type: TransactionType;
  created_at: string;
  user: UserReadDTO;
  card_type: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
}
