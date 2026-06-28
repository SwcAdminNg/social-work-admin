import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listManagedCourses } from "@/lib/api/courses";
import { CourseManagementList } from "@/components/courses-admin/CourseManagementList";

export default async function CourseManagementPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await listManagedCourses({ page: 1, page_size: 12 }, session.accessToken);

  return <CourseManagementList initialData={initialData} />;
}
