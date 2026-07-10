import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCatalogs } from "@/lib/api/courses";
import { CourseCatalogsManager } from "@/components/courses-admin/CourseCatalogsManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Course Catalogs | Admin Panel",
  description: "Manage course catalogs and group categories for the platform.",
};

export default async function CourseCatalogsPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getCatalogs(session.accessToken);

  return <CourseCatalogsManager initialData={initialData} />;
}
