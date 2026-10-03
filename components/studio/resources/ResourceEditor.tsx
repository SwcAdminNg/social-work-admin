"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  EyeOff,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button, Card, CardHeader, Field, Input, ProgressBar, Tabs, Textarea, cn, type TabDef } from "@/components/ui/primitives";
import { ConfirmDialog, Menu, type MenuItem } from "@/components/ui/overlays";
import { CourseCover } from "@/components/studio/courses/CourseCover";
import { FileDrop } from "@/components/studio/curriculum/FileDrop";
import { InlineText } from "@/components/studio/editor/InlineText";
import { SaveBar } from "@/components/studio/editor/SaveBar";
import { useDraft } from "@/components/studio/editor/useDraft";
import { uploadToSignedUrl } from "@/lib/studio/api";
import { deleteResource, getThumbnailUploadUrl, publishResource, updateResource } from "@/lib/api/resources-client";
import type { ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { categoryLabel } from "@/components/resources-admin/constants";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { ResourceStatusBadges } from "./ResourceCard";
import { resourceKeys, useResourceEditor } from "./ResourceEditorContext";
import { RESOURCE_CATEGORIES, RESOURCE_CATEGORY_ICONS, attachmentIssue, plural } from "./resourceMeta";
import { VisibilityPicker } from "./VisibilityPicker";

type Tab = "attachments" | "details";

/* ───────────────────────── Header ───────────────────────── */

function Header({ onGoToDetails }: { onGoToDetails: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resource, resourceId, run } = useResourceEditor();
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!resource) return null;

  const attachments = resource.attachments ?? [];
  const problems = attachments.filter((a) => attachmentIssue(a)).length;
  const published = resource.is_published;
  const canPublish = published || attachments.length > 0;

  const menu: MenuItem[] = [
    { label: "Reload", icon: RefreshCw, onSelect: () => void queryClient.invalidateQueries({ queryKey: resourceKeys.detail(resourceId) }) },
    "separator",
    { label: "Delete resource", icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) },
  ];

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/dashboard/resource-management"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-[13px] font-semibold text-slate-500 no-underline transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All resources
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            onClick={onGoToDetails}
            aria-label={resource.thumbnail_url ? "Change cover image" : "Add a cover image"}
            className="group relative hidden aspect-video w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-black/5 sm:block dark:ring-white/10"
          >
            <CourseCover
              title={resource.name}
              seed={resource.id}
              thumbnailUrl={resource.thumbnail_url}
              icon={RESOURCE_CATEGORY_ICONS[resource.category]}
              size="sm"
              className="h-full w-full"
            />
            <span className="absolute inset-0 grid place-items-center bg-slate-950/50 text-white opacity-0 transition group-hover:opacity-100">
              <ImagePlus className="h-5 w-5" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <ResourceStatusBadges resource={resource} />
            <h1 className="mt-1.5 flex min-w-0 font-display text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
              <InlineText
                value={resource.name}
                ariaLabel="Resource name"
                className="min-w-0"
                onSave={(name) => run(() => updateResource(resourceId, { name }), { success: "Name updated" })}
              />
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500 dark:text-slate-400">
              <span>{categoryLabel(resource.category)}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{plural(attachments.length, "attachment")}</span>
              {resource.course_title && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {resource.course_title}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {published ? (
            <Button variant="outline" icon={EyeOff} onClick={() => setConfirmPublish(true)}>
              Unpublish
            </Button>
          ) : (
            <Button
              icon={Rocket}
              onClick={() => setConfirmPublish(true)}
              disabled={!canPublish}
              title={canPublish ? undefined : "Add at least one attachment before publishing"}
            >
              Publish
            </Button>
          )}
          <Menu trigger={<Button variant="ghost" iconOnly icon={MoreHorizontal} aria-label="More resource actions" />} items={menu} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        tone={published ? "warning" : "brand"}
        title={published ? "Unpublish this resource?" : "Publish this resource?"}
        description={
          published
            ? "It disappears from the resource library. You can publish it again at any time."
            : problems
              ? `${plural(problems, "attachment")} still ${problems === 1 ? "needs" : "need"} attention (missing or unfinished uploads). People will see ${problems === 1 ? "it" : "them"} as empty until fixed.`
              : "It becomes visible straight away to the audience you've chosen."
        }
        confirmLabel={published ? "Unpublish" : "Publish now"}
        onConfirm={async () => {
          const ok = await run(() => publishResource(resourceId, !published), {
            success: published ? "Resource unpublished" : "Resource published",
          });
          if (!ok) throw new Error("failed");
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this resource?"
        description={`“${resource.name}” and all of its attachments will be removed. This can't be undone.`}
        confirmLabel="Delete resource"
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await deleteResource(resourceId);
              return true;
            },
            { success: "Resource deleted", refresh: false },
          );
          if (!ok) throw new Error("failed");
          void queryClient.invalidateQueries({ queryKey: resourceKeys.all });
          router.replace("/dashboard/resource-management");
        }}
      />
    </header>
  );
}

/* ───────────────────────── Details tab ───────────────────────── */

function CoverCard() {
  const { resource, resourceId, run, refresh } = useResourceEditor();
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file (JPG, PNG or WebP).");
    if (file.size > 10 * 1024 * 1024) return toast.error("That image is over 10 MB. Try a smaller one.");
    const local = URL.createObjectURL(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return local;
    });
    setProgress(0);
    const target = await run(() => getThumbnailUploadUrl(resourceId, { file_name: file.name, content_type: file.type || "image/png" }), {
      refresh: false,
    });
    if (!target) {
      setProgress(null);
      setPreview(null);
      return;
    }
    try {
      await uploadToSignedUrl(target.upload_url, file, setProgress);
      // The backend records the new URL when it issues the upload link; re-fetch so every view updates.
      await refresh();
      toast.success("Cover image updated");
    } catch (err) {
      toast.error((err as Error).message);
      setPreview(null);
    } finally {
      setProgress(null);
    }
  }

  const src = preview ?? resource?.thumbnail_url ?? null;
  const uploading = progress !== null;

  return (
    <Card>
      <CardHeader icon={ImageIcon} title="Cover image" description="Shown on the resource card and page. Use a 16:9 image, at least 1280×720." />
      <div className="grid gap-5 md:grid-cols-2 md:items-center">
        <div className="relative aspect-video overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-ink-line">
          <CourseCover
            title={resource?.name}
            seed={resourceId}
            thumbnailUrl={src}
            icon={resource ? RESOURCE_CATEGORY_ICONS[resource.category] : undefined}
            className="h-full w-full"
          />
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <ProgressBar value={progress ?? 0} />
              <p className="mt-1.5 text-xs font-semibold text-white">Uploading… {progress}%</p>
            </div>
          )}
        </div>
        <FileDrop
          accept="image/*"
          onFile={upload}
          disabled={uploading}
          icon={ImagePlus}
          title={resource?.thumbnail_url ? "Replace the cover image" : "Add a cover image"}
          hint="Drop an image here or browse. JPG, PNG or WebP, up to 10 MB."
        />
      </div>
    </Card>
  );
}

function DetailsTab() {
  const { resource, resourceId, run } = useResourceEditor();
  const base = useMemo(
    () => ({
      name: resource?.name ?? "",
      description: resource?.description ?? "",
      category: (resource?.category ?? "PRACTICE_RESOURCES") as ResourceCategory,
      visibility: (resource?.visibility ?? "PUBLIC") as ResourceVisibility,
      course_id: resource?.course_id ?? null,
      course_title: resource?.course_title ?? null,
    }),
    [resource],
  );
  const draft = useDraft(base);
  const v = draft.values;
  const [errors, setErrors] = useState<Partial<Record<"name" | "course", string>>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const e: typeof errors = {};
    if (!v.name.trim()) e.name = "Give the resource a name.";
    if (v.visibility === "COURSE_ENROLLED" && !v.course_id) e.course = "Choose the course this resource belongs to.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const ok = await run(
      () =>
        updateResource(resourceId, {
          name: v.name.trim(),
          description: v.description.trim() || null,
          category: v.category,
          visibility: v.visibility,
          course_id: v.visibility === "COURSE_ENROLLED" ? v.course_id : null,
        }),
      { success: "Changes saved" },
    );
    setSaving(false);
    if (ok) draft.reset();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader icon={FileText} title="Basics" description="What is it, and why should someone open it?" />
        <div className="flex flex-col gap-4">
          <Field label="Name" htmlFor="res-name" required error={errors.name}>
            <Input id="res-name" value={v.name} maxLength={255} invalid={!!errors.name} onChange={(e) => draft.set("name", e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="res-desc" optional>
            <Textarea id="res-desc" rows={4} value={v.description} onChange={(e) => draft.set("description", e.target.value)} />
          </Field>
          <Field label="Category">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RESOURCE_CATEGORIES.map((c) => {
                const selected = c.value === v.category;
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => draft.set("category", c.value)}
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
          </Field>
        </div>
      </Card>

      <CoverCard />

      <Card>
        <CardHeader title="Who can open it" />
        <VisibilityPicker
          visibility={v.visibility}
          courseId={v.course_id}
          courseTitle={v.course_title}
          courseError={errors.course}
          onVisibility={(vis) => draft.set("visibility", vis)}
          onCourse={(id, title) => {
            draft.set("course_id", id);
            draft.set("course_title", title);
          }}
        />
      </Card>

      <SaveBar visible={draft.dirty} saving={saving} onSave={save} onDiscard={() => (draft.reset(), setErrors({}))} />
    </div>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

export function ResourceEditor() {
  const { resource } = useResourceEditor();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tab: Tab = searchParams.get("tab") === "details" ? "details" : "attachments";

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "attachments") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  if (!resource) return null;
  const issues = (resource.attachments ?? []).filter((a) => attachmentIssue(a)).length;

  const tabs: TabDef<Tab>[] = [
    {
      key: "attachments",
      label: "Attachments",
      icon: Paperclip,
      count: issues || resource.attachments?.length || 0,
      tone: issues ? "warning" : undefined,
    },
    { key: "details", label: "Details", icon: FileText },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
      <Header onGoToDetails={() => setTab("details")} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {/* Both tabs stay mounted so unsaved detail edits survive switching. */}
      <div role="tabpanel" aria-label="Attachments" hidden={tab !== "attachments"}>
        <AttachmentsPanel />
      </div>
      <div role="tabpanel" aria-label="Details" hidden={tab !== "details"}>
        <DetailsTab />
      </div>
    </div>
  );
}
