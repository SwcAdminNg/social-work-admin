"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Info,
  ListChecks,
  Lock,
  Palette,
  RotateCcw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Badge, Button, Callout, Card, CardHeader, Skeleton, Switch, cn, toneClasses } from "@/components/ui/primitives";
import { Select } from "@/components/ui/select";
import { CertificatePreview } from "@/components/certificates-admin/CertificatePreview";
import { toFormState } from "@/components/certificates-admin/TemplateEditor";
import { listCertificateTemplates, updateCourseCertificateSettings } from "@/lib/api/certificates-client";
import type { CertificateTemplate } from "@/lib/api/certificates.types";
import type { Item } from "@/lib/studio/types";
import { itemKind, KIND_META, plural } from "../curriculum/itemMeta";
import { useCourseEditor } from "./CourseEditorContext";
import { DEFAULT_PASS_MARK, PassMarkField, clampPassMark, passMarkMeaning } from "./PassMarkField";

/* The API doesn't return a course's assigned template, so the last one saved is remembered per browser. */
const templateKey = (courseId: string) => `certificate-template:${courseId}`;
function readStoredTemplate(courseId: string) {
  try {
    return window.localStorage.getItem(templateKey(courseId)) ?? "";
  } catch {
    return "";
  }
}
function storeTemplate(courseId: string, id: string) {
  try {
    window.localStorage.setItem(templateKey(courseId), id);
  } catch {
    /* storage unavailable — the setting is still saved server-side */
  }
}

const longDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "";

function assessmentPassMark(item: Item) {
  const a = item.assessment;
  return a?.quiz?.pass_mark_percentage ?? a?.essay?.pass_mark_percentage ?? a?.quiz_group?.pass_mark_percentage;
}

/* ───────────────────────── Requirements ───────────────────────── */

function Requirement({ icon: Icon, done = true, children }: { icon: typeof CheckCircle2; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg",
          done ? "bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300" : "bg-slate-100 text-slate-400 dark:bg-white/5",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 pt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">{children}</span>
    </li>
  );
}

/* ───────────────────────── Tab ───────────────────────── */

export function CertificateTab() {
  const { course, courseId, run, governanceEnabled, lifecycle, readOnly, lockReason } = useCourseEditor();
  const enabled = !!course?.certificate_enabled;
  const savedPassMark = clampPassMark(course?.certificate_pass_mark_percentage ?? DEFAULT_PASS_MARK);
  const [passMark, setPassMark] = useState<number | null>(null); // null = not edited
  const [savingPassMark, setSavingPassMark] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const draftPassMark = passMark ?? savedPassMark;
  const passMarkDirty = passMark !== null && passMark !== savedPassMark;
  const reviewed = governanceEnabled && lifecycle === "PUBLISHED";
  const savedMessage = reviewed ? "Saved to your draft — it goes live when the update is published" : undefined;

  const assessments = useMemo(
    () =>
      (course?.sections ?? []).flatMap((s) =>
        (s.items ?? []).filter((i) => i.item_type === "ASSESSMENT").map((item) => ({ item, module: s.title })),
      ),
    [course?.sections],
  );

  async function toggleEnabled(next: boolean) {
    setTogglingEnabled(true);
    await run(() => updateCourseCertificateSettings(courseId, { certificate_enabled: next }), {
      success: savedMessage ?? (next ? "Certificates turned on for this course" : "Certificates turned off for this course"),
    });
    setTogglingEnabled(false);
  }

  async function savePassMark() {
    setSavingPassMark(true);
    const ok = await run(
      async () => {
        await updateCourseCertificateSettings(courseId, { certificate_pass_mark_percentage: draftPassMark });
        return true;
      },
      { success: savedMessage ?? `Pass mark set to ${draftPassMark}%` },
    );
    setSavingPassMark(false);
    if (ok) setPassMark(null);
  }

  if (!course) return null;
  const scheduledEnd = course.access_mode === "SCHEDULED" && course.access_end_date ? course.access_end_date : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {readOnly ? (
        <Callout tone="neutral" icon={Lock}>
          {lockReason === "archived"
            ? "This course is archived, so its certificate settings can't be changed."
            : lockReason === "live-layer"
              ? "You're viewing the live version. Switch back to the draft to change certificate settings."
              : "Certificate settings are locked while this course's update is in review."}
        </Callout>
      ) : (
        reviewed && (
          <Callout tone="warning" icon={ShieldAlert} title="Certificate changes go through review">
            Turning certificates on or off and changing the pass mark are high-risk changes. They&apos;re saved to the draft and reach
            learners when the update is published.
          </Callout>
        )
      )}

      {/* ── Issuance ── */}
      <Card>
        <CardHeader
          icon={Award}
          title="Certificate of completion"
          description="Issued automatically — there's nothing to send by hand. Certificates already issued are never taken back."
        />
        <Switch
          checked={enabled}
          disabled={readOnly || togglingEnabled}
          onChange={toggleEnabled}
          label="Award a certificate when learners pass this course"
          description="Leave off for courses whose content keeps changing — there's no fixed finish line to certify."
        />

        {enabled && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-ink-line dark:bg-white/[0.02]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">How a learner earns it</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              <Requirement icon={ListChecks}>Finishes every lesson and assessment in the course.</Requirement>
              <Requirement icon={Target} done={assessments.length > 0}>
                {assessments.length > 0 ? (
                  <>
                    Scores at least <strong className="text-slate-900 dark:text-white">{savedPassMark}%</strong> overall across{" "}
                    {plural(assessments.length, "assessment")}.
                  </>
                ) : (
                  <>Passes automatically — the course has no assessments to score yet.</>
                )}
              </Requirement>
              <Requirement icon={Camera}>Has a profile photo on their account (it&apos;s printed on the certificate).</Requirement>
              {scheduledEnd && (
                <Requirement icon={CalendarClock}>
                  Waits until the course closes on{" "}
                  <strong className="text-slate-900 dark:text-white" suppressHydrationWarning>
                    {longDate(scheduledEnd)}
                  </strong>{" "}
                  — everyone in the cohort is certified together, even if they finish early.
                </Requirement>
              )}
            </ul>
          </div>
        )}
      </Card>

      {/* ── Pass mark ── */}
      <Card className={cn(!enabled && "opacity-90")}>
        <CardHeader
          icon={Target}
          title="Pass mark"
          description="The overall score is the average of each learner's best attempt on every assessment in the course."
          actions={
            !enabled ? (
              <Badge tone="neutral" size="xs">
                Certificates are off
              </Badge>
            ) : undefined
          }
        />
        <PassMarkField value={draftPassMark} onChange={setPassMark} disabled={readOnly || !enabled} />

        <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">{passMarkMeaning(draftPassMark, assessments.length)}</p>

        {passMarkDirty && !readOnly && (
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-ink-line">
            <span className="flex items-center gap-2 text-xs font-semibold text-amber-600 sm:mr-auto dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved: {savedPassMark}% → {draftPassMark}%
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPassMark(null)} disabled={savingPassMark} className="flex-1 sm:flex-none">
                Discard
              </Button>
              <Button size="sm" onClick={savePassMark} loading={savingPassMark} className="flex-1 sm:flex-none">
                Save pass mark
              </Button>
            </div>
          </div>
        )}

        {/* What counts towards the score */}
        <div className="mt-5 border-t border-slate-100 pt-5 dark:border-ink-line">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Counts towards the score</p>
            {assessments.length > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{plural(assessments.length, "assessment")}</span>}
          </div>
          {assessments.length === 0 ? (
            <Callout tone="info" icon={Info}>
              Add a quiz, quiz group or essay in the curriculum and it will count here. Until then, everyone who finishes the course passes.
            </Callout>
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 p-0 dark:divide-ink-line dark:border-ink-line">
              {assessments.map(({ item, module }) => {
                const meta = KIND_META[itemKind(item)];
                const own = assessmentPassMark(item);
                return (
                  <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={cn("grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ring-1 ring-inset", toneClasses(meta.tone))}>
                      <meta.icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {meta.label} · {module}
                        {itemKind(item) === "ESSAY" && " · counts once the grade is released"}
                      </span>
                    </span>
                    {typeof own === "number" && (
                      <Badge tone="neutral" size="xs" title="This assessment's own pass mark">
                        Own pass mark {own}%
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {assessments.some(({ item }) => itemKind(item) === "ESSAY") && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              While an essay grade is unreleased the result is pending. The certificate is issued automatically once the grade is released, if the
              learner passed.
            </p>
          )}
        </div>
      </Card>

      <TemplateCard courseId={courseId} readOnly={readOnly} />
    </div>
  );
}

/* ───────────────────────── Design / template ───────────────────────── */

function TemplateCard({ courseId, readOnly }: { courseId: string; readOnly: boolean }) {
  const { run } = useCourseEditor();
  const [templateId, setTemplateId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);

  // localStorage isn't available during server rendering, so read it after mount.
  useEffect(() => {
    const stored = readStoredTemplate(courseId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount avoids an SSR mismatch
    setTemplateId(stored);
    setSavedId(stored);
  }, [courseId]);

  const templatesQuery = useQuery({
    queryKey: ["certificate-templates", "active"],
    queryFn: async () => (await listCertificateTemplates({ page: 1, page_size: 100 })).items.filter((t) => t.is_active),
    staleTime: 60_000,
  });
  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  // With nothing assigned, the backend falls back to the oldest active global template.
  const globalDefault = useMemo<CertificateTemplate | undefined>(
    () => [...templates].filter((t) => t.is_global).sort((a, b) => a.created_at.localeCompare(b.created_at))[0],
    [templates],
  );
  const shown = templates.find((t) => t.id === templateId) ?? (templateId ? undefined : globalDefault);
  const dirty = templateId !== savedId;

  async function save() {
    setSaving(true);
    const ok = await run(
      async () => {
        await updateCourseCertificateSettings(courseId, templateId ? { certificate_template_id: templateId } : { clear_template: true });
        return true;
      },
      { success: templateId ? "Certificate design assigned" : "Using the global default design", refresh: false },
    );
    setSaving(false);
    if (ok) {
      storeTemplate(courseId, templateId);
      setSavedId(templateId);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={Palette}
        title="Design"
        description="Which certificate template this course uses."
        actions={
          <Link href="/dashboard/certificates" className="text-sm font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300">
            Manage templates
          </Link>
        }
      />
      {templatesQuery.isPending ? (
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="aspect-[1.414] w-full rounded-xl" />
        </div>
      ) : templatesQuery.isError ? (
        <Callout
          tone="danger"
          icon={Palette}
          title="We couldn't load certificate templates"
          actions={
            <Button variant="outline" size="sm" icon={RotateCcw} loading={templatesQuery.isFetching} onClick={() => templatesQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {templatesQuery.error instanceof Error ? templatesQuery.error.message : "Check your connection and try again."}
        </Callout>
      ) : templates.length === 0 ? (
        <Callout tone="warning" icon={Palette} title="No active templates">
          Learners can&apos;t receive a certificate until a template exists.{" "}
          <Link href="/dashboard/certificates/new" className="font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300">
            Create one
          </Link>
          .
        </Callout>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-start">
          <div className="flex flex-col gap-3">
            <Select
              aria-label="Certificate template"
              value={templateId}
              disabled={readOnly}
              onChange={setTemplateId}
              options={[
                {
                  value: "",
                  label: "Global default",
                  description: globalDefault ? `Currently “${globalDefault.name}”` : "No global template yet",
                },
                ...templates.map((t) => ({ value: t.id, label: t.name, description: t.is_global ? "Global template" : "Private template" })),
              ]}
            />
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              The assigned template isn&apos;t returned by the API, so this shows the last one saved in this browser.
            </p>
            {dirty && !readOnly && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTemplateId(savedId)} disabled={saving}>
                  Discard
                </Button>
                <Button size="sm" onClick={save} loading={saving}>
                  Save design
                </Button>
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-ink-line dark:bg-white/[0.02]">
            {shown ? (
              <CertificatePreview state={toFormState(shown)} logoUrl={shown.logo_url} signatureImageUrl={shown.signature_image_url} />
            ) : (
              <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No design to preview.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
