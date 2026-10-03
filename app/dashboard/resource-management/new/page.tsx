import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateResource } from "@/components/studio/resources/CreateResource";

export default async function NewResourcePage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string; course_title?: string }>;
}) {
  const session = await auth();
  const isStaff = session?.user?.userType === "ADMIN" || session?.user?.userType === "INSTRUCTOR";
  if (!session?.accessToken || !isStaff) {
    redirect("/dashboard/not-authorized");
  }

  // Arriving from a course's Resources tab pre-selects that course.
  const { course_id, course_title } = await searchParams;
  return <CreateResource presetCourseId={course_id ?? null} presetCourseTitle={course_title ?? null} />;
}
