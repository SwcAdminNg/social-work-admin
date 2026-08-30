"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreateResourceForm } from "@/components/resources-admin/CreateResourceForm";

export function NewResourcePageContent() {
  const searchParams = useSearchParams();
  const presetCourseId = searchParams.get("course_id") ?? undefined;
  const presetCourseTitle = searchParams.get("course_title") ?? undefined;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/resource-management"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Resource Management
        </Link>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
          Create a new resource
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Start with the basics — you&apos;ll attach videos, documents, and links next.
        </p>
      </div>
      <CreateResourceForm presetCourseId={presetCourseId} presetCourseTitle={presetCourseTitle} />
    </div>
  );
}
