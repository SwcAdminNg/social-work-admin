export interface ContactMessage {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  company_name?: string;
  message: string;
  platform: string;
  category?: string;
  // Human-readable enquiry type from the API, e.g. "Account or Learning Support".
  category_label?: string | null;
  subject?: string;
  // Short reference shown to the visitor on the website, e.g. "SWCL-1A2B3C4D".
  reference?: string;
  // Extra labelled answers from richer forms (e.g. the mentorship forms), in order.
  details?: { label: string; value: string }[] | null;
  // Path of the public page whose form sent the message, e.g. "/contact".
  source_page?: string | null;
}
