"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createCertificateTemplate } from "@/lib/api/certificates-client";
import { IconSpinner } from "@/components/dashboard/icons";
import { TemplateFormFields, type TemplateFormState } from "./TemplateFormFields";

const DEFAULT_STATE: TemplateFormState = {
  name: "",
  titleText: "Certificate of Completion",
  subtitleText: "This certificate is proudly presented to",
  bodyText:
    'for successfully completing the course "{course_title}" on {completion_date}, demonstrating dedication and mastery of the material.',
  organizationName: "Social Workers Academy",
  footerText: "",
  signatureName: "",
  signatureTitle: "",
  primaryColor: "#0B3D2E",
  accentColor: "#D4AF37",
  backgroundColor: "#FFFDF7",
  textColor: "#1F2937",
  fontFamily: "Helvetica",
  borderStyle: "CLASSIC",
};

export function CreateTemplateForm() {
  const router = useRouter();
  const [state, setState] = useState<TemplateFormState>(DEFAULT_STATE);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(next: Partial<TemplateFormState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const template = await createCertificateTemplate({
        name: state.name.trim(),
        title_text: state.titleText || undefined,
        subtitle_text: state.subtitleText || null,
        body_text: state.bodyText || undefined,
        organization_name: state.organizationName || undefined,
        footer_text: state.footerText || null,
        signature_name: state.signatureName || null,
        signature_title: state.signatureTitle || null,
        primary_color: state.primaryColor,
        accent_color: state.accentColor,
        background_color: state.backgroundColor,
        text_color: state.textColor,
        font_family: state.fontFamily,
        border_style: state.borderStyle,
      });
      toast.success("Certificate template created.");
      router.push(`/dashboard/certificates/${template.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create certificate template.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TemplateFormFields state={state} onChange={handleChange} />

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting && <IconSpinner className="text-white/80" />}
        {submitting ? "Creating…" : "Create template"}
      </button>
    </form>
  );
}
