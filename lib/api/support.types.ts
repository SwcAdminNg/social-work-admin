export interface FaqCategory {
  id: string;
  name: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FaqItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateFaqCategoryPayload {
  name: string;
  order?: number;
}

export interface UpdateFaqCategoryPayload {
  name?: string;
  order?: number;
}

export interface CreateFaqItemPayload {
  category_id: string;
  question: string;
  answer: string;
  order?: number;
  is_published?: boolean;
}

export interface UpdateFaqItemPayload {
  category_id?: string;
  question?: string;
  answer?: string;
  order?: number;
  is_published?: boolean;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface TicketUserSummary {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
}

export interface Ticket {
  id: string;
  subject?: string | null;
  status: TicketStatus;
  user_id: string;
  user?: TicketUserSummary | null;
  assigned_admin_id?: string | null;
  assigned_admin?: TicketUserSummary | null;
  created_at: string;
  updated_at?: string;
  last_user_message_at?: string | null;
  last_admin_reply_at?: string | null;
  escalated_at?: string | null;
  rating?: number | null;
  rating_comment?: string | null;
}

export type TicketSenderType = "USER" | "ADMIN";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: TicketSenderType;
  sender_id: string;
  sender?: TicketUserSummary | null;
  message: string;
  created_at: string;
}

export interface GetTicketsParams {
  status?: TicketStatus;
  assigned_admin_id?: string;
  page?: number;
  page_size?: number;
}

export interface AssignTicketPayload {
  admin_id: string;
}

export interface SetTicketStatusPayload {
  status: TicketStatus;
}

export interface SendTicketMessagePayload {
  message: string;
}
