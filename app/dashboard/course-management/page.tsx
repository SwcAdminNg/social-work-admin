import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccessProvider } from "@/components/studio/AccessContext";
import { CourseLibrary } from "@/components/studio/courses/CourseLibrary";
import { adminAccess, readAccess, readCourses } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

export default async function CourseManagementPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const [access, courses] = await Promise.all([readAccess(session.accessToken), readCourses(session.accessToken)]);

  return (
    <AccessProvider access={adminAccess(access)}>
      <CourseLibrary initialCourses={courses} initialDrafts={null} initialReturned={null} />
    </AccessProvider>
  );
}
