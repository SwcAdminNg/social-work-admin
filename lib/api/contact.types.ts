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
  subject?: string;
  // Path of the public page whose form sent the message, e.g. "/contact".
  source_page?: string | null;
}
