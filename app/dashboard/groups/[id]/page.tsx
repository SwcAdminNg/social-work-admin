import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGroup, getGroupMembers } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { GroupMembersList } from "@/components/groups-admin/GroupMembersList";

export default async function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.accessToken || session.user.userType !== "ADMIN") {
    redirect("/dashboard/not-authorized");
  }

  const { group, members } = await fetchGroupAndMembers(id, session.accessToken);
  return <GroupMembersList group={group} initialMembers={members} />;
}

async function fetchGroupAndMembers(id: string, token: string) {
  try {
    const [group, members] = await Promise.all([
      getGroup(id, token),
      getGroupMembers(id, { page: 1, page_size: 50 }, token),
    ]);
    return { group, members };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }
}
