import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getManagedCourse } from "@/lib/api/courses";
import { ApiError } from "@/lib/api/client";
import { CourseEditor } from "@/components/courses-admin/CourseEditor";

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const course = await fetchCourse(id, session.accessToken);
  return <CourseEditor initialCourse={course} />;
}

async function fetchCourse(id: string, token: string) {
  try {
    return await getManagedCourse(id, token);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }
}
