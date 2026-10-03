import Link from "next/link";
import type { Resource } from "@/lib/api/resources.types";
import { IconLink, IconTrash } from "@/components/dashboard/icons";
import { PublishedBadge, VisibilityBadge } from "./StatusBadge";
import { categoryLabel } from "./constants";

export function ResourceCard({
  resource,
  onDelete,
}: {
  resource: Resource;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line overflow-hidden hover:border-brand-600/40 dark:hover:border-brand-400/40 hover:shadow-md transition-all duration-200">
      <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
        {resource.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resource.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <IconLink />
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PublishedBadge isPublished={resource.is_published} />
            <VisibilityBadge visibility={resource.visibility} />
          </div>
        </div>
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
          {resource.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{categoryLabel(resource.category)}</p>
        {resource.course_title && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
            Tied to <span className="font-medium text-slate-500 dark:text-slate-400">{resource.course_title}</span>
          </p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            href={`/dashboard/resource-management/${resource.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-600/10 dark:bg-brand-400/15 hover:bg-brand-600/20 dark:hover:bg-brand-400/25 no-underline transition-colors duration-150"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${resource.name}`}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
