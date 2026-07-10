import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFeaturedCourses } from "@/lib/api/courses";
import { FeaturedCoursesManager } from "@/components/courses-admin/FeaturedCoursesManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured Courses | Admin Panel",
  description: "Manage and reorder the featured courses displayed on the platform homepage.",
};

export default async function FeaturedCoursesPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getFeaturedCourses(
    { page: 1, limit: 50 },
    session.accessToken,
  );

  return <FeaturedCoursesManager initialData={initialData} />;
}
