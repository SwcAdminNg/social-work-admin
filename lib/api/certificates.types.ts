export type CertificateBorderStyle = "CLASSIC" | "MODERN" | "NONE";

export interface CertificateTemplate {
  id: string;
  owner_id: string | null;
  name: string;
  title_text: string;
  subtitle_text: string | null;
  body_text: string;
  organization_name: string;
  footer_text: string | null;
  signature_name: string | null;
  signature_title: string | null;
  logo_url?: string | null;
  signature_image_url?: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  border_style: CertificateBorderStyle;
  is_active: boolean;
  is_global: boolean;
  created_at: string;
}

export interface CertificateTemplateCreatePayload {
  name: string;
  title_text?: string;
  subtitle_text?: string | null;
  body_text?: string;
  organization_name?: string;
  footer_text?: string | null;
  signature_name?: string | null;
  signature_title?: string | null;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string;
  border_style?: CertificateBorderStyle;
}

export type CertificateTemplateUpdatePayload = Partial<CertificateTemplateCreatePayload> & {
  is_active?: boolean;
};

export interface CertificateTemplateListParams {
  page?: number;
  page_size?: number;
}

export interface CertificateImageUploadRequestPayload {
  file_name: string;
  content_type?: string | null;
}

export interface CertificateImageUploadResponse {
  upload_url: string;
  image_url: string;
}

export interface CourseCertificateSettingsPayload {
  certificate_enabled?: boolean | null;
  certificate_template_id?: string | null;
  clear_template?: boolean;
}
