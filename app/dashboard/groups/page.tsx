import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGroups } from "@/lib/api/groups";
import { GroupsList } from "@/components/groups-admin/GroupsList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Groups | Admin Panel",
  description: "Manage staff groups used to target notifications and escalations.",
};

export default async function GroupsPage() {
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const initialData = await getGroups({ page: 1, page_size: 20 }, session.accessToken);

  return <GroupsList initialData={initialData} />;
}
