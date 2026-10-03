"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteCourse, getManagedCourse } from "@/lib/api/courses-client";
import type { CourseDetail } from "@/lib/api/courses.types";
import {
  IconBookOpen,
  IconCertificate,
  IconClipboardCheck,
  IconClock,
  IconFolder,
  IconGrid,
  IconLink,
  IconMessageCircle,
  IconReceipt,
  IconTrash,
} from "@/components/dashboard/icons";
import { courseEditorReducer, hasAnyCurriculumItem } from "./courseEditorReducer";
import { PublishedBadge } from "./StatusBadge";
import { PublishControl } from "./PublishControl";
import { ConfirmDialog } from "./ConfirmDialog";
import { StatTile } from "./StatTile";
import { categoryLabel, levelLabel } from "./constants";
import { CourseDetailsTab } from "./CourseDetailsTab";
import { CourseCurriculumTab } from "./CourseCurriculumTab";
import { CourseTransactionsTab } from "./CourseTransactionsTab";
import { CourseCertificateTab } from "./CourseCertificateTab";
import { CourseResourcesTab } from "./CourseResourcesTab";
import { CourseCommunityTab } from "./CourseCommunityTab";
import { CourseGovernanceTab } from "./CourseGovernanceTab";

const VIDEO_POLL_INTERVAL_MS = 5000;

function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

type Tab = "details" | "curriculum" | "governance" | "resources" | "chat" | "sales" | "certificate";
type CourseLayer = "auto" | "live" | "draft";

export function CourseEditor({ initialCourse }: { initialCourse: CourseDetail }) {
  const router = useRouter();
  const [course, dispatch] = useReducer(courseEditorReducer, initialCourse);
  const [tab, setTab] = useState<Tab>("details");
  const [layer, setLayer] = useState<CourseLayer>((initialCourse.governance?.layer as CourseLayer | undefined) ?? "auto");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const courseRef = useRef(course);
  useEffect(() => {
    courseRef.current = course;
  }, [course]);

  const hasPendingVideo = course.sections.some((s) =>
    s.items.some((i) => i.video && (i.video.status === "PENDING" || i.video.status === "PROCESSING"))
  );

  const stats = useMemo(() => {
    const items = course.sections.flatMap((s) => s.items);
    return {
      sectionCount: course.sections.length,
      itemCount: items.length,
      totalMinutes: items.reduce((sum, i) => sum + (i.estimated_minutes ?? 0), 0),
      assessmentCount: items.filter((i) => i.item_type === "ASSESSMENT").length,
    };
  }, [course.sections]);

  useEffect(() => {
    if (!hasPendingVideo) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await getManagedCourse(courseRef.current.id);
        dispatch({ type: "SET_COURSE", course: fresh });
      } catch {
        // Silent failure — manual refresh button remains available.
      }
    }, VIDEO_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPendingVideo]);

  async function refreshCourse() {
    try {
      const fresh = await getManagedCourse(course.id, { layer });
      dispatch({ type: "SET_COURSE", course: fresh });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to refresh course.");
    }
  }

  async function handleLayerChange(nextLayer: CourseLayer) {
    setLayer(nextLayer);
    try {
      const fresh = await getManagedCourse(course.id, { layer: nextLayer });
      dispatch({ type: "SET_COURSE", course: fresh });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load selected course layer.");
    }
  }

  async function handleDeleteCourse() {
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      toast.success("Course deleted.");
      router.push("/dashboard/course-management");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete course.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/course-management"
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 no-underline transition-colors duration-150"
        >
          ← Back to Course Management
        </Link>
      </div>

      {/* Hero banner — thumbnail, title, and at-a-glance course meta */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-green-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-white/70">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt=""
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <IconBookOpen />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
              {categoryLabel(course.category)} · {levelLabel(course.level)}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight truncate">
                {course.title}
              </h1>
              <PublishedBadge isPublished={course.is_published} tone="banner" />
              {course.governance_status && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-white/80">
                  {course.governance_status}
                </span>
              )}
              {course.current_version_label && (
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-white/80">
                  v{course.current_version_label}
                </span>
              )}
            </div>
            <p className="text-sm text-white/80 mt-2">
              {course.is_free ? "Free course" : `₦${(course.price ?? 0).toLocaleString()}`}
              {course.is_exclusive ? " · Exclusive" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={IconFolder} label="Sections" value={stats.sectionCount} />
        <StatTile icon={IconGrid} label="Items" value={stats.itemCount} />
        <StatTile icon={IconClock} label="Est. duration" value={formatDuration(stats.totalMinutes)} />
        <StatTile icon={IconClipboardCheck} label="Assessments" value={stats.assessmentCount} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-ink-surface p-1 self-start overflow-x-auto">
          {(
            [
              { key: "details", label: "Details", icon: IconBookOpen, count: undefined },
              { key: "curriculum", label: "Curriculum", icon: IconGrid, count: stats.itemCount },
              { key: "governance", label: "Governance", icon: IconClipboardCheck, count: course.governance?.open_revision ? 1 : undefined },
              { key: "resources", label: "Resources", icon: IconLink, count: undefined },
              { key: "chat", label: "Class Chat", icon: IconMessageCircle, count: undefined },
              { key: "certificate", label: "Certificate", icon: IconCertificate, count: undefined },
              { key: "sales", label: "Sales & Transactions", icon: IconReceipt, count: undefined },
            ] as const satisfies readonly { key: Tab; label: string; icon: React.ComponentType; count: number | undefined }[]
          ).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                tab === key
                  ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon />
              {label}
              {typeof count === "number" && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[0.65rem] font-bold ${
                    tab === key
                      ? "bg-brand-600/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-400"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <PublishControl
            course={course}
            canPublish={hasAnyCurriculumItem(course)}
            onPublished={refreshCourse}
          />
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            aria-label="Delete course"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {tab === "details" && (
        <CourseDetailsTab
          course={course}
          onUpdated={(fields) => dispatch({ type: "UPDATE_COURSE_FIELDS", fields })}
        />
      )}
      {tab === "curriculum" && (
        <div className="flex flex-col gap-4">
          {course.governance?.governance_enabled && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-ink-line dark:bg-ink-surface">
              <span className="text-xs font-bold uppercase text-slate-500">Layer</span>
              {(["auto", "draft", "live"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleLayerChange(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    layer === option
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              ))}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Current response: {course.governance.layer ?? layer}
              </span>
            </div>
          )}
          <CourseCurriculumTab course={course} dispatch={dispatch} onRefresh={refreshCourse} />
        </div>
      )}
      {tab === "governance" && <CourseGovernanceTab course={course} onRefresh={refreshCourse} />}
      {tab === "resources" && <CourseResourcesTab courseId={course.id} courseTitle={course.title} />}
      {tab === "chat" && <CourseCommunityTab courseId={course.id} />}
      {tab === "certificate" && (
        <CourseCertificateTab
          courseId={course.id}
          certificateEnabled={course.certificate_enabled}
          accessMode={course.access_mode}
          accessEndDate={course.access_end_date}
          onUpdated={(fields) => dispatch({ type: "UPDATE_COURSE_FIELDS", fields })}
        />
      )}
      {tab === "sales" && (
        <CourseTransactionsTab courseId={course.id} />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this course?"
        description={`"${course.title}" and its entire curriculum will be removed from listings.`}
        loading={deleting}
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
