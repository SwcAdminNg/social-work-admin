import Link from "next/link";
import type { Course } from "@/lib/api/courses.types";
import { IconBookOpen, IconTrash, IconStar, IconClock } from "@/components/dashboard/icons";
import { PublishedBadge } from "./StatusBadge";
import { categoryLabel, levelLabel } from "./constants";

export function CourseCard({
  course,
  onDelete,
}: {
  course: Course;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line overflow-hidden hover:border-brand-600/40 dark:hover:border-brand-400/40 hover:shadow-md transition-all duration-200">
      <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <IconBookOpen />
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PublishedBadge isPublished={course.is_published} />
            {course.is_exclusive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                Exclusive
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">
            {course.is_free ? "Free" : course.price != null ? `₦${course.price.toLocaleString()}` : "Paid"}
          </span>
        </div>
        <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
          {course.title}
        </h3>
        
        {/* Instructors */}
        {course.instructors && course.instructors.length > 0 && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
            {course.instructors[0].name}
            {course.instructors[0].is_guest && (
              <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Guest
              </span>
            )}
            {course.instructors.length > 1 && (
              <span className="text-slate-400"> +{course.instructors.length - 1}</span>
            )}
          </p>
        )}

        {/* Timed Access */}
        {course.access_mode === "SCHEDULED" && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md w-fit">
            <IconClock className="w-3.5 h-3.5" />
            <span>
              {course.access_start_date ? new Date(course.access_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "?"}
              {" – "}
              {course.access_end_date ? new Date(course.access_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "?"}
            </span>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {categoryLabel(course.category)} &middot; {levelLabel(course.level)}
        </p>
        {(course.average_rating !== undefined && course.total_reviews !== undefined) && (
          <div className="flex items-center gap-1 mt-0.5">
            {course.average_rating > 0 ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5L2.5 9.2l6.6-.7L12 2.5z" />
                </svg>
                <span className="text-[0.65rem] font-bold text-slate-700 dark:text-slate-300">
                  {course.average_rating.toFixed(1)}
                </span>
                <span className="text-[0.65rem] text-slate-400 dark:text-slate-500">
                  ({course.total_reviews})
                </span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
                  <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5L2.5 9.2l6.6-.7L12 2.5z" />
                </svg>
                <span className="text-[0.65rem] text-slate-400 dark:text-slate-500">
                  No reviews
                </span>
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            href={`/dashboard/course-management/${course.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-600/10 dark:bg-brand-400/15 hover:bg-brand-600/20 dark:hover:bg-brand-400/25 no-underline transition-colors duration-150"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${course.title}`}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
