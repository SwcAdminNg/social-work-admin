export interface ContactMessage {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone_number: string;
  company_name?: string;
  message: string;
  platform: string;
  category?: string;
  subject?: string;
}
