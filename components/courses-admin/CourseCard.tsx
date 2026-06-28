import Link from "next/link";
import type { Course } from "@/lib/api/courses.types";
import { IconBookOpen, IconTrash } from "@/components/dashboard/icons";
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
    <div className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-[#2D6A4F]/40 dark:hover:border-[#52b788]/40 hover:shadow-md transition-all duration-200">
      <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-700">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <IconBookOpen />
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <PublishedBadge isPublished={course.is_published} />
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-600">
            {course.is_free ? "Free" : course.price != null ? `₦${course.price.toLocaleString()}` : "Paid"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {categoryLabel(course.category)} &middot; {levelLabel(course.level)}
        </p>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Link
            href={`/dashboard/course-management/${course.id}`}
            className="flex-1 text-center px-3 py-2 rounded-xl text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 no-underline transition-colors duration-150"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${course.title}`}
            className="p-2 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
