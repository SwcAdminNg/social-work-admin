"use client";

import Link from "next/link";
import { CreateCourseForm } from "@/components/courses-admin/CreateCourseForm";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <Link
          href="/dashboard/course-management"
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 no-underline transition-colors duration-150"
        >
          ← Back to Course Management
        </Link>
        <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
          Create a new course
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Start with the basics — you&apos;ll build the curriculum, uploads, and quizzes next.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
