import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInstructorApplications } from "@/lib/api/instructor-applications";
import { ApplicationQueueList } from "@/components/instructor-applications/ApplicationQueueList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instructor Applications | Admin Panel",
  description: "Review and manage instructor applications.",
};

export default async function InstructorApplicationsPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getInstructorApplications({ status: "PENDING", page: 1, page_size: 20 }, session.accessToken);

  return <ApplicationQueueList initialData={initialData} />;
}
