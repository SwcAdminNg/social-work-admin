import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listManagedResources } from "@/lib/api/resources";
import { ResourceManagementList } from "@/components/resources-admin/ResourceManagementList";

export default async function ResourceManagementPage() {
  const session = await auth();

  const isStaff = session?.user?.userType === "ADMIN" || session?.user?.userType === "INSTRUCTOR";
  if (!session?.accessToken || !isStaff) {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await listManagedResources({ page: 1, page_size: 12 }, session.accessToken);

  return <ResourceManagementList initialData={initialData} />;
}
