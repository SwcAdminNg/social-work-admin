"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteCertificateTemplate, updateCertificateTemplate } from "@/lib/api/certificates-client";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import { IconSpinner, IconTrash } from "@/components/dashboard/icons";
import { ToggleField } from "@/components/courses-admin/FormControls";
import { ConfirmDialog } from "@/components/courses-admin/ConfirmDialog";
import { TemplateFormFields, type TemplateFormState } from "./TemplateFormFields";
import { CertificateImageUploader } from "./CertificateImageUploader";

function toFormState(template: CertificateTemplate): TemplateFormState {
  return {
    name: template.name,
    titleText: template.title_text,
    subtitleText: template.subtitle_text ?? "",
    bodyText: template.body_text,
    organizationName: template.organization_name,
    footerText: template.footer_text ?? "",
    signatureName: template.signature_name ?? "",
    signatureTitle: template.signature_title ?? "",
    primaryColor: template.primary_color,
    accentColor: template.accent_color,
    backgroundColor: template.background_color,
    textColor: template.text_color,
    fontFamily: template.font_family,
    borderStyle: template.border_style,
  };
}

export function TemplateEditor({ initialTemplate }: { initialTemplate: CertificateTemplate }) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [state, setState] = useState<TemplateFormState>(toFormState(initialTemplate));
  const [saving, setSaving] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleChange(next: Partial<TemplateFormState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!state.name.trim()) {
      toast.error("Template name is required.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCertificateTemplate(template.id, {
        name: state.name.trim(),
        title_text: state.titleText,
        subtitle_text: state.subtitleText || null,
        body_text: state.bodyText,
        organization_name: state.organizationName,
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
      setTemplate(updated);
      setState(toFormState(updated));
      toast.success("Certificate template saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save certificate template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(checked: boolean) {
    setTogglingActive(true);
    try {
      const updated = await updateCertificateTemplate(template.id, { is_active: checked });
      setTemplate(updated);
      toast.success(checked ? "Template activated." : "Template deactivated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update template status.");
    } finally {
      setTogglingActive(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCertificateTemplate(template.id);
      toast.success("Certificate template deleted.");
      router.push("/dashboard/certificates");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete certificate template.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/certificates"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Certificates
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#2D6A4F] to-[#1e4d38] text-white shadow-lg shadow-green-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 sm:p-8">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
              {template.is_global ? "Global template" : "Private template"}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{template.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors duration-150 cursor-pointer flex-shrink-0"
          >
            <IconTrash />
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
        <ToggleField
          label="Template active"
          hint="Inactive templates can't be assigned to new courses and drop out of the global fallback pool."
          checked={template.is_active}
          onChange={handleToggleActive}
          disabled={togglingActive}
        />
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Logo &amp; signature</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Uploads apply immediately — no separate save step needed.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CertificateImageUploader
            templateId={template.id}
            kind="logo"
            label="Logo"
            hint="Rendered centered near the top, above the organization name."
            currentImageUrl={template.logo_url ?? null}
            onImageUploaded={(url) => setTemplate((prev) => ({ ...prev, logo_url: url }))}
          />
          <CertificateImageUploader
            templateId={template.id}
            kind="signature"
            label="Signature image"
            hint="Rendered above the signature line, alongside the signature name/title."
            currentImageUrl={template.signature_image_url ?? null}
            onImageUploaded={(url) => setTemplate((prev) => ({ ...prev, signature_image_url: url }))}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <TemplateFormFields state={state} onChange={handleChange} />

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer self-start"
        >
          {saving && <IconSpinner className="text-white/80" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this template?"
        description={`"${template.name}" will be removed. Courses using it will fall back to the global default.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
