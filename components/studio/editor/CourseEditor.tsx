"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BadgeDollarSign,
  FileText,
  History,
  LayoutList,
  Library,
  MessagesSquare,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { Button, ButtonLink, Card, EmptyState, Skeleton, Tabs, type TabDef } from "@/components/ui/primitives";
import { CourseCommunityTab } from "@/components/courses-admin/CourseCommunityTab";
import { CourseGovernanceTab } from "@/components/courses-admin/CourseGovernanceTab";
import { CourseResourcesTab } from "@/components/courses-admin/CourseResourcesTab";
import { CourseTransactionsTab } from "@/components/courses-admin/CourseTransactionsTab";
import type { CourseDetail } from "@/lib/api/courses.types";
import { curriculumHealth } from "@/lib/studio/health";
import { CurriculumBuilder } from "../curriculum/CurriculumBuilder";
import { CourseUploadsProvider } from "../curriculum/uploads";
import { CertificateTab } from "./CertificateTab";
import { useCourseEditor } from "./CourseEditorContext";
import { DetailsTab } from "./DetailsTab";
import { EditorHeader } from "./EditorHeader";
import { PricingTab } from "./PricingTab";
import { StateBanners } from "./StateBanner";

export type EditorTab = "curriculum" | "details" | "pricing" | "certificate" | "review" | "resources" | "chat" | "sales";
const TAB_KEYS: EditorTab[] = ["curriculum", "details", "pricing", "certificate", "review", "resources", "chat", "sales"];

function EditorSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6" aria-busy aria-label="Loading course">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="hidden aspect-video w-28 rounded-xl sm:block" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="hidden h-10 w-40 lg:block" />
      </div>
      <Skeleton className="h-11 w-full max-w-xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex flex-col gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
        <Skeleton className="hidden h-72 rounded-2xl xl:block" />
      </div>
    </div>
  );
}

/** The course editor: header, state banners, the studio editing tabs and the admin's operational tabs. */
export function CourseEditor() {
  const { course, isLoading, error, refresh, governanceEnabled } = useCourseEditor();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const requested = searchParams.get("tab") as EditorTab | null;
  const tab: EditorTab =
    requested && TAB_KEYS.includes(requested) && !(requested === "review" && !governanceEnabled) ? requested : "curriculum";

  function setTab(next: EditorTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "curriculum") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    // Native history keeps this a client-only change (no server round trip).
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  const issues = useMemo(() => curriculumHealth(course), [course]);
  const errorCount = issues.filter((i) => i.severity === "error").length;

  if (!course && isLoading) return <EditorSkeleton />;

  if (!course) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <EmptyState
          icon={AlertTriangle}
          title="We couldn't load this course"
          description={error?.message ?? "Check your connection and try again."}
          action={
            <>
              <Button icon={RefreshCw} onClick={() => refresh()}>
                Try again
              </Button>
              <ButtonLink href="/dashboard/course-management" variant="outline">
                Back to all courses
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  const tabs: TabDef<EditorTab>[] = [
    { key: "curriculum", label: "Curriculum", icon: LayoutList, count: issues.length, tone: errorCount ? "danger" : "warning" },
    { key: "details", label: "Details", icon: FileText },
    { key: "pricing", label: "Pricing & access", icon: BadgeDollarSign },
    { key: "certificate", label: "Certificate", icon: Award },
    { key: "review", label: "Review & history", icon: History, hidden: !governanceEnabled },
    { key: "resources", label: "Resources", icon: Library },
    { key: "chat", label: "Class chat", icon: MessagesSquare },
    { key: "sales", label: "Sales", icon: Receipt },
  ];

  return (
    <CourseUploadsProvider>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
        <EditorHeader onGoToTab={setTab} />
        <StateBanners onGoToReview={() => setTab("review")} />
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {/* Form tabs stay mounted so unsaved edits survive switching tabs. */}
        <div role="tabpanel" aria-label="Curriculum" hidden={tab !== "curriculum"}>
          <CurriculumBuilder issues={issues} onGoToTab={setTab} />
        </div>
        <div role="tabpanel" aria-label="Details" hidden={tab !== "details"}>
          <DetailsTab />
        </div>
        <div role="tabpanel" aria-label="Pricing and access" hidden={tab !== "pricing"}>
          <PricingTab />
        </div>
        <div role="tabpanel" aria-label="Certificate" hidden={tab !== "certificate"}>
          <CertificateTab />
        </div>
        {/* Operational tabs load their own data, so they only mount when opened. */}
        {tab === "review" && (
          <div role="tabpanel" aria-label="Review and history">
            <CourseGovernanceTab course={course as unknown as CourseDetail} onRefresh={() => void refresh()} />
          </div>
        )}
        {tab === "resources" && (
          <div role="tabpanel" aria-label="Resources">
            <CourseResourcesTab courseId={course.id} courseTitle={course.title} />
          </div>
        )}
        {tab === "chat" && (
          <div role="tabpanel" aria-label="Class chat">
            <CourseCommunityTab courseId={course.id} />
          </div>
        )}
        {tab === "sales" && (
          <div role="tabpanel" aria-label="Sales">
            <CourseTransactionsTab courseId={course.id} />
          </div>
        )}
      </div>
    </CourseUploadsProvider>
  );
}
