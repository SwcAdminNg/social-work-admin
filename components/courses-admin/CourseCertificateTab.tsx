"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listCertificateTemplates, updateCourseCertificateSettings } from "@/lib/api/certificates-client";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import { IconClock, IconSpinner } from "@/components/dashboard/icons";
import { ToggleField } from "./FormControls";
import type { AccessMode } from "@/lib/api/courses.types";

interface StoredCertificateSettings {
  certificateEnabled: boolean;
  templateId: string;
}

function storageKey(courseId: string): string {
  return `certificate-settings:${courseId}`;
}

function readStoredSettings(courseId: string): StoredCertificateSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.certificateEnabled !== "boolean" || typeof parsed.templateId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSettings(courseId: string, settings: StoredCertificateSettings): void {
  try {
    localStorage.setItem(storageKey(courseId), JSON.stringify(settings));
  } catch {
    // Non-fatal — the setting was still saved server-side.
  }
}

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

export function CourseCertificateTab({
  courseId,
  accessMode,
  accessEndDate,
}: {
  courseId: string;
  accessMode?: AccessMode;
  accessEndDate?: string | null;
}) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [certificateEnabled, setCertificateEnabled] = useState(true);
  const [templateId, setTemplateId] = useState("");
  const [saving, setSaving] = useState(false);

  // Server-rendered markup has no access to localStorage, so the first client render must match
  // it exactly (the defaults above) to avoid a hydration mismatch — the stored value is applied
  // only after mount, once hydration has already settled.
  useEffect(() => {
    const stored = readStoredSettings(courseId);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage, must run post-mount to avoid SSR mismatch
      setCertificateEnabled(stored.certificateEnabled);
      setTemplateId(stored.templateId);
    }
  }, [courseId]);

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
      writeStoredSettings(courseId, { certificateEnabled: enabled, templateId });
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
      writeStoredSettings(courseId, { certificateEnabled, templateId });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update certificate settings.");
    } finally {
      setSaving(false);
    }
  }

  const holdsForSchedule = accessMode === "SCHEDULED" && !!accessEndDate;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {holdsForSchedule && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
          <IconClock className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            This course is scheduled with an end date of{" "}
            <strong>
              {new Date(accessEndDate as string).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
            . Certificates are held back and issued together once that date passes, even for
            students who finish earlier.
          </p>
        </div>
      )}

      <FormSection
        title="Issuance"
        description="A certificate is issued automatically the moment a student completes this course."
      >
        <ToggleField
          label="Certificates enabled"
          hint="Turn off to stop issuing certificates for this course going forward — this always wins, even once a scheduled course's end date passes. Already-issued certificates are unaffected."
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
            The API doesn&apos;t return what&apos;s currently assigned, so this remembers your last save in this
            browser only — it won&apos;t reflect changes made elsewhere or on another device.
          </p>
        </FormSection>
      </form>
    </div>
  );
}
