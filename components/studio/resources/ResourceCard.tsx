"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { Badge, Skeleton, cn } from "@/components/ui/primitives";
import { Menu, type MenuItem } from "@/components/ui/overlays";
import { CourseCover } from "@/components/studio/courses/CourseCover";
import { categoryLabel } from "@/components/resources-admin/constants";
import type { Resource } from "@/lib/api/resources.types";
import { RESOURCE_CATEGORY_ICONS, VISIBILITY_META } from "./resourceMeta";

export type ResourceView = "grid" | "list";

export function ResourceStatusBadges({ resource, size = "xs" }: { resource: Resource; size?: "xs" | "sm" }) {
  const vis = VISIBILITY_META[resource.visibility];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={resource.is_published ? "success" : "neutral"} size={size} dot>
        {resource.is_published ? "Published" : "Draft"}
      </Badge>
      {vis && (
        <Badge tone={vis.tone} size={size} icon={vis.icon}>
          {vis.label}
        </Badge>
      )}
    </div>
  );
}

export function ResourceCard({
  resource,
  view = "grid",
  onDelete,
}: {
  resource: Resource;
  view?: ResourceView;
  onDelete: (resource: Resource) => void;
}) {
  const router = useRouter();
  const href = `/dashboard/resource-management/${resource.id}`;
  const Icon = RESOURCE_CATEGORY_ICONS[resource.category];

  const items: MenuItem[] = [
    { label: "Open editor", icon: PencilLine, onSelect: () => router.push(href) },
    "separator",
    { label: "Delete resource", icon: Trash2, danger: true, onSelect: () => onDelete(resource) },
  ];

  const menu = (
    <Menu
      items={items}
      trigger={
        <button
          type="button"
          aria-label={`Actions for ${resource.name}`}
          className={cn(
            "grid h-8 w-8 cursor-pointer place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
            view === "grid"
              ? "bg-white/85 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:bg-ink-surface/85 dark:text-slate-200 dark:hover:bg-ink-surface"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white",
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
      }
    />
  );

  const tiedCourse = resource.course_title && (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <BookOpen className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
      <span className="truncate">{resource.course_title}</span>
    </span>
  );

  if (view === "list") {
    return (
      <div className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 pr-4 transition hover:border-brand-200 hover:shadow-[0_12px_32px_-24px_rgba(45,106,79,0.5)] dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40">
        <CourseCover
          title={resource.name}
          seed={resource.id}
          thumbnailUrl={resource.thumbnail_url}
          icon={Icon}
          size="sm"
          className="h-16 w-24 flex-shrink-0 rounded-xl sm:h-[72px] sm:w-32"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="line-clamp-1 font-display text-[15px] font-bold text-slate-900 no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
          >
            {resource.name || "Untitled resource"}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{categoryLabel(resource.category)}</p>
          <div className="mt-2 sm:hidden">
            <ResourceStatusBadges resource={resource} />
          </div>
        </div>
        <div className="hidden w-48 flex-shrink-0 lg:block">{tiedCourse}</div>
        <div className="hidden flex-shrink-0 sm:block">
          <ResourceStatusBadges resource={resource} />
        </div>
        <div className="relative z-10 flex-shrink-0">{menu}</div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40">
      <CourseCover title={resource.name} seed={resource.id} thumbnailUrl={resource.thumbnail_url} icon={Icon} className="aspect-[16/9] w-full" />
      <div className="absolute right-3 top-3 z-10">{menu}</div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{categoryLabel(resource.category)}</p>
          <Link
            href={href}
            className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug text-slate-900 no-underline after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300"
          >
            {resource.name || "Untitled resource"}
          </Link>
        </div>
        <ResourceStatusBadges resource={resource} />
        {tiedCourse && <div className="mt-auto border-t border-slate-100 pt-3 dark:border-ink-line">{tiedCourse}</div>}
      </div>
    </div>
  );
}

export function ResourceCardSkeleton({ view }: { view: ResourceView }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-ink-line dark:bg-ink-surface">
        <Skeleton className="h-16 w-24 rounded-xl sm:h-[72px] sm:w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-ink-line dark:bg-ink-surface">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
    </div>
  );
}
