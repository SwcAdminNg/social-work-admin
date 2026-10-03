"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  EyeOff,
  History,
  ImagePlus,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Rocket,
  Trash2,
} from "lucide-react";
import { Badge, Button, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Menu, type MenuItem } from "@/components/ui/overlays";
import { LifecycleBadge, RevisionStatusBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { studioApi } from "@/lib/studio/api";
import { formatMinutes, isInReview } from "@/lib/studio/labels";
import { useCourseEditor } from "./CourseEditorContext";
import { InlineText } from "./InlineText";
import { courseStats } from "../curriculum/HealthPanel";
import { plural } from "../curriculum/itemMeta";

export function EditorHeader({ onGoToTab }: { onGoToTab: (tab: "review" | "pricing") => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { course, courseId, governanceEnabled, lifecycle, revision, readOnly, run } = useCourseEditor();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmReinstate, setConfirmReinstate] = useState(false);
  const [confirmPublishRevision, setConfirmPublishRevision] = useState(false);

  if (!course) return null;

  const stats = courseStats(course);
  const duration = course.estimated_duration || formatMinutes(stats.minutes);
  const currentLabel = course.governance?.current_version_label ?? course.current_version_label;
  const inReview = !!revision && isInReview(revision.status);
  const returned = revision?.status === "RETURNED_FOR_REVISION";
  const editableDraft = lifecycle !== "ARCHIVED" && (revision ? revision.is_editable !== false && !inReview : lifecycle === "DRAFT");
  const published = !!course.is_published;

  const hasItems = stats.lessons + stats.assessments > 0;
  const noItemsHint = hasItems ? undefined : "Add at least one curriculum item before publishing";
  const approvalHref = revision ? `/dashboard/approval-centre/revisions/${revision.id}` : null;

  let primary: React.ReactNode = null;
  if (governanceEnabled) {
    if (lifecycle === "ARCHIVED")
      primary = (
        <Button icon={RotateCcw} onClick={() => setConfirmReinstate(true)}>
          Reinstate
        </Button>
      );
    else if (revision && (revision.status === "READY_TO_PUBLISH" || editableDraft))
      // Admins can publish an open revision directly; the backend still enforces outstanding approvals.
      primary = (
        <Button icon={Rocket} onClick={() => setConfirmPublishRevision(true)} disabled={!hasItems} title={noItemsHint}>
          {lifecycle === "PUBLISHED" ? "Publish update" : "Publish"}
        </Button>
      );
    else if (inReview || returned)
      primary = (
        <Button variant="secondary" icon={Clock3} onClick={() => onGoToTab("review")}>
          {returned ? "Changes requested" : "View review status"}
        </Button>
      );
    else if (lifecycle === "PUBLISHED")
      primary = (
        <Badge tone="success" icon={CheckCircle2} title="Edit anything to start a new update">
          Up to date
        </Badge>
      );
    else
      primary = (
        <Button icon={Rocket} onClick={() => setConfirmPublish(true)} disabled={!hasItems} title={noItemsHint}>
          Publish
        </Button>
      );
  } else if (lifecycle !== "ARCHIVED") {
    primary = published ? (
      <Button variant="outline" icon={EyeOff} onClick={() => setConfirmPublish(true)}>
        Unpublish
      </Button>
    ) : (
      <Button icon={Rocket} onClick={() => setConfirmPublish(true)} disabled={!hasItems} title={noItemsHint}>
        Publish
      </Button>
    );
  }

  const menuItems: MenuItem[] = [
    { label: "Reload course", icon: RefreshCw, onSelect: () => void queryClient.invalidateQueries({ queryKey: ["studio", "course", courseId] }) },
  ];
  if (governanceEnabled) menuItems.push({ label: "Review & history", icon: History, onSelect: () => onGoToTab("review") });
  if (approvalHref) menuItems.push({ label: "Open in Approval Centre", icon: ClipboardCheck, onSelect: () => router.push(approvalHref) });
  if (governanceEnabled && lifecycle === "PUBLISHED")
    menuItems.push({ label: "Archive course", icon: Archive, onSelect: () => setConfirmArchive(true) });
  menuItems.push("separator", { label: "Delete course", icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) });

  return (
    <header className="flex flex-col gap-4">
      <Link
        href="/dashboard/course-management"
        className="inline-flex w-fit items-center gap-1.5 rounded-md text-[13px] font-semibold text-slate-500 no-underline transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> All courses
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button
            type="button"
            onClick={() => onGoToTab("pricing")}
            aria-label={course.thumbnail_url ? "Change cover image" : "Add a cover image"}
            className="group relative hidden aspect-video w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 ring-1 ring-black/5 sm:block dark:ring-white/10"
          >
            {course.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="absolute inset-0 m-auto h-7 w-7 text-white/80" strokeWidth={1.6} />
            )}
            <span className="absolute inset-0 grid place-items-center bg-slate-950/50 text-white opacity-0 transition group-hover:opacity-100">
              <ImagePlus className="h-5 w-5" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <LifecycleBadge lifecycle={lifecycle} size="xs" />
              {currentLabel && <VersionBadge label={currentLabel} size="xs" />}
              {governanceEnabled && revision && revision.status !== "DRAFT" && <RevisionStatusBadge status={revision.status} size="xs" />}
              {governanceEnabled && revision?.status === "DRAFT" && lifecycle === "PUBLISHED" && (
                <Badge tone="warning" size="xs">
                  Unsubmitted changes
                </Badge>
              )}
            </div>
            <h1 className="mt-1.5 flex min-w-0 font-display text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl dark:text-white">
              <InlineText
                value={course.title}
                disabled={readOnly}
                ariaLabel="Course title"
                className="min-w-0"
                onSave={(title) =>
                  run(() => studioApi.updateCourse(courseId, { title }), {
                    success: governanceEnabled && lifecycle === "PUBLISHED" ? "Title saved to your draft" : "Title updated",
                  })
                }
              />
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500 dark:text-slate-400">
              <span>{plural(stats.modules, "module")}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span>{plural(stats.lessons + stats.assessments, "item")}</span>
              {duration && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" /> {duration}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className={cn("flex flex-shrink-0 flex-wrap items-center gap-2")}>
          {primary}
          <Menu trigger={<Button variant="ghost" iconOnly icon={MoreHorizontal} aria-label="More course actions" />} items={menuItems} />
        </div>
      </div>


      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this course?"
        description={
          published
            ? `“${course.title}” is live. Deleting it removes it from the catalogue and from enrolled learners' dashboards. This can't be undone.`
            : `“${course.title}” and everything in it will be removed. This can't be undone.`
        }
        confirmLabel="Delete course"
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await studioApi.deleteCourse(courseId);
              return true;
            },
            { success: "Course deleted", refresh: false },
          );
          if (!ok) throw new Error("failed");
          void queryClient.invalidateQueries({ queryKey: ["studio", "courses"] });
          router.replace("/dashboard/course-management");
        }}
      />

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        tone={published ? "warning" : "brand"}
        title={published ? "Unpublish this course?" : "Publish this course?"}
        description={
          published
            ? "It disappears from the catalogue and new learners can't enrol. You can publish it again at any time."
            : "Learners will be able to find and enrol in it straight away. You need at least one lesson or assessment."
        }
        confirmLabel={published ? "Unpublish" : "Publish now"}
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await studioApi.setPublished(courseId, !published);
              return true;
            },
            { success: published ? "Course unpublished" : "Course published — learners can enrol now" },
          );
          if (!ok) throw new Error("failed");
        }}
      />
      <ConfirmDialog
        open={confirmPublishRevision}
        onOpenChange={setConfirmPublishRevision}
        tone="brand"
        title={lifecycle === "PUBLISHED" ? "Publish this update?" : "Publish this course?"}
        description={
          lifecycle === "PUBLISHED"
            ? "Learners switch to the new version straight away. Any approvals the update still needs are checked first."
            : "Learners will be able to find and enrol in it straight away. Any approvals it still needs are checked first."
        }
        confirmLabel="Publish now"
        onConfirm={async () => {
          if (!revision) return;
          const ok = await run(
            async () => {
              await studioApi.publish(revision.id);
              return true;
            },
            { success: lifecycle === "PUBLISHED" ? "Update published" : "Course published" },
          );
          if (!ok) throw new Error("failed");
        }}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        tone="warning"
        title="Archive this course?"
        description="It leaves the catalogue and new learners can't enrol. Enrolled learners keep access. You can reinstate it later."
        confirmLabel="Archive course"
        reason={{ label: "Reason", placeholder: "Why is this course being archived?" }}
        onConfirm={async (reason) => {
          const ok = await run(
            async () => {
              await studioApi.archive(courseId, reason || undefined);
              return true;
            },
            { success: "Course archived" },
          );
          if (!ok) throw new Error("failed");
        }}
      />

      <ConfirmDialog
        open={confirmReinstate}
        onOpenChange={setConfirmReinstate}
        tone="brand"
        title="Reinstate this course?"
        description="This opens a reinstatement revision. Publish it to put the course back in the catalogue."
        confirmLabel="Reinstate"
        reason={{ label: "Reason", placeholder: "Why is this course coming back?" }}
        onConfirm={async (reason) => {
          const ok = await run(
            async () => {
              await studioApi.reinstate(courseId, reason || undefined);
              return true;
            },
            { success: "Reinstatement revision created" },
          );
          if (!ok) throw new Error("failed");
        }}
      />
    </header>
  );
}
