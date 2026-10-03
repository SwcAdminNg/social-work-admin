"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Info, Rocket } from "lucide-react";
import { Button, ButtonLink, Callout, Card, CardHeader, Field, Input, PageHeader, Textarea, cn } from "@/components/ui/primitives";
import { CourseCover } from "@/components/studio/courses/CourseCover";
import { createResource } from "@/lib/api/resources-client";
import { ApiError } from "@/lib/api/client";
import type { ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { categoryLabel } from "@/components/resources-admin/constants";
import { resourceKeys } from "./ResourceEditorContext";
import { ResourceStatusBadges } from "./ResourceCard";
import { RESOURCE_CATEGORIES, RESOURCE_CATEGORY_ICONS } from "./resourceMeta";
import { VisibilityPicker } from "./VisibilityPicker";

type Errors = Partial<Record<"name" | "course", string>>;

/**
 * Create a resource as a draft. Arriving from a course ("Add resource" on the
 * course's Resources tab) pre-selects course-only visibility for that course.
 */
export function CreateResource({ presetCourseId, presetCourseTitle }: { presetCourseId?: string | null; presetCourseTitle?: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("PRACTICE_RESOURCES");
  const [visibility, setVisibility] = useState<ResourceVisibility>(presetCourseId ? "COURSE_ENROLLED" : "PUBLIC");
  const [courseId, setCourseId] = useState<string | null>(presetCourseId ?? null);
  const [courseTitle, setCourseTitle] = useState<string | null>(presetCourseTitle ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Give the resource a name.";
    if (visibility === "COURSE_ENROLLED" && !courseId) next.course = "Choose the course this resource belongs to.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const resource = await createResource({
        name: name.trim(),
        category,
        description: description.trim() || null,
        visibility,
        course_id: visibility === "COURSE_ENROLLED" ? courseId : null,
      });
      void queryClient.invalidateQueries({ queryKey: resourceKeys.all });
      toast.success("Resource created as a draft");
      router.push(`/dashboard/resource-management/${resource.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create the resource");
      setSubmitting(false);
    }
  }

  const backHref = presetCourseId ? `/dashboard/course-management/${presetCourseId}?tab=resources` : "/dashboard/resource-management";

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-6xl flex-col gap-6" noValidate>
      <div className="flex flex-col gap-3">
        <ButtonLink href={backHref} variant="ghost" size="sm" icon={ArrowLeft} className="-ml-2 w-fit">
          {presetCourseId ? "Back to course" : "All resources"}
        </ButtonLink>
        <PageHeader
          eyebrow="New resource"
          title="Create a resource"
          description="Start with the basics. It's saved as a draft — add attachments next, then publish when it's ready."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Basics" description="What is it, and why should someone open it?" />
            <div className="flex flex-col gap-4">
              <Field label="Name" htmlFor="res-name" required error={errors.name} aside={<span className="text-xs text-slate-400">{name.length}/255</span>}>
                <Input
                  id="res-name"
                  value={name}
                  maxLength={255}
                  invalid={!!errors.name}
                  placeholder="e.g. Safeguarding referral checklist"
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
                  }}
                  autoFocus
                />
              </Field>
              <Field label="Description" htmlFor="res-desc" optional hint="A sentence or two shown on the resource card and page.">
                <Textarea id="res-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Category" description="Where it's listed in the resource library." />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RESOURCE_CATEGORIES.map((c) => {
                const selected = c.value === category;
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition",
                      selected
                        ? "border-brand-500 bg-brand-50/70 text-brand-800 ring-4 ring-brand-400/15 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-200"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:text-slate-200 dark:hover:bg-white/5",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", selected ? "text-brand-600 dark:text-brand-300" : "text-slate-400")} />
                    <span className="min-w-0 leading-tight">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Who can open it" description="You can change this later." />
            <VisibilityPicker
              visibility={visibility}
              courseId={courseId}
              courseTitle={courseTitle}
              courseError={errors.course}
              onVisibility={(v) => {
                setVisibility(v);
                if (v !== "COURSE_ENROLLED") setErrors((x) => ({ ...x, course: undefined }));
              }}
              onCourse={(id, title) => {
                setCourseId(id);
                setCourseTitle(title);
                if (id) setErrors((x) => ({ ...x, course: undefined }));
              }}
            />
            {presetCourseId && visibility !== "COURSE_ENROLLED" && (
              <Callout tone="warning" icon={Info} className="mt-4">
                This resource won&apos;t be tied to “{presetCourseTitle}” unless it stays course-only.
              </Callout>
            )}
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ButtonLink href={backHref} variant="outline">
              Cancel
            </ButtonLink>
            <Button type="submit" icon={Rocket} loading={submitting}>
              Create draft resource
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <aside className="hidden lg:block">
          <div className="sticky top-[88px] flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Live preview</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_-18px_rgba(16,24,40,0.18)] dark:border-ink-line dark:bg-ink-surface">
              <CourseCover title={name || "New resource"} seed={name || "new-resource"} icon={RESOURCE_CATEGORY_ICONS[category]} className="aspect-[16/9] w-full" />
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{categoryLabel(category)}</p>
                  <p className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                    {name.trim() || "Your resource name"}
                  </p>
                  {description.trim() && <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
                </div>
                <ResourceStatusBadges
                  resource={{
                    id: "preview",
                    name,
                    slug: "",
                    category,
                    description,
                    thumbnail_url: null,
                    visibility,
                    course_id: courseId,
                    owner_id: "",
                    is_published: false,
                  }}
                />
                {visibility === "COURSE_ENROLLED" && courseTitle && (
                  <span className="inline-flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-ink-line dark:text-slate-400">
                    <BookOpen className="h-3.5 w-3.5" /> {courseTitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
