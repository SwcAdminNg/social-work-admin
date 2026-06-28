"use client";

import Link from "next/link";
import { CreateCourseForm } from "@/components/courses-admin/CreateCourseForm";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/course-management"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Course Management
        </Link>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
          Create a new course
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Start with the basics — you&apos;ll build the curriculum, uploads, and quizzes next.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
