"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listCertificateTemplates, updateCourseCertificateSettings } from "@/lib/api/certificates-client";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { ToggleField } from "./FormControls";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function CourseCertificateTab({ courseId }: { courseId: string }) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [templateId, setTemplateId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listCertificateTemplates({ page: 1, page_size: 100 });
        if (!cancelled) setTemplates(result.items.filter((t) => t.is_active));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Failed to load certificate templates.");
        }
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveEnabled(enabled: boolean) {
    setCertificateEnabled(enabled);
    setSaving(true);
    try {
      await updateCourseCertificateSettings(courseId, { certificate_enabled: enabled });
      toast.success(enabled ? "Certificates enabled for this course." : "Certificates turned off for this course.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update certificate settings.");
      setCertificateEnabled(!enabled);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (templateId) {
        await updateCourseCertificateSettings(courseId, { certificate_template_id: templateId });
        toast.success("Certificate template assigned to this course.");
      } else {
        await updateCourseCertificateSettings(courseId, { clear_template: true });
        toast.success("Certificate template unassigned — using the global default.");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update certificate settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <FormSection
        title="Issuance"
        description="A certificate is issued automatically the moment a student completes this course."
      >
        <ToggleField
          label="Certificates enabled"
          hint="Turn off to stop issuing certificates for this course going forward. Already-issued certificates are unaffected."
          checked={certificateEnabled}
          onChange={handleSaveEnabled}
          disabled={saving}
        />
      </FormSection>

      <form onSubmit={handleAssignTemplate}>
        <FormSection
          title="Template"
          description="Pick which design this course uses. Leave unassigned to fall back to the oldest active global template."
        >
          {loadingTemplates ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <IconSpinner />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active templates yet.{" "}
              <Link href="/dashboard/certificates/new" className="text-[#2D6A4F] dark:text-[#52b788] font-semibold no-underline hover:underline">
                Create one
              </Link>{" "}
              to assign it here.
            </p>
          ) : (
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            >
              <option value="">Use global default</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.is_global ? " (global)" : ""}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer self-start"
          >
            {saving && <IconSpinner className="text-white/80" />}
            {saving ? "Saving…" : "Save template"}
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-600">
            There&apos;s no way to read back what&apos;s currently assigned — this form always applies the
            selection above when you click save.
          </p>
        </FormSection>
      </form>
    </div>
  );
}
