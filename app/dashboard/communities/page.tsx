import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyCommunities } from "@/lib/api/community";
import { CommunityHub } from "@/components/community-admin/CommunityHub";

export default async function CommunitiesPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/dashboard/not-authorized");
  }

  const initialCommunities = await listMyCommunities(session.accessToken);

  return (
    <CommunityHub initialCommunities={initialCommunities} isAdmin={session.user.userType === "ADMIN"} />
  );
}
