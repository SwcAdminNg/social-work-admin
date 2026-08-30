"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { listMyCommunities } from "@/lib/api/community-client";
import { CommunityChatPanel } from "@/components/community-admin/CommunityChatPanel";
import { CommunityMembersPanel } from "@/components/community-admin/CommunityMembersPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconMessageCircle, IconSpinner } from "@/components/dashboard/icons";

/**
 * Every course gets its chat automatically the instant it's created — there's no dedicated
 * "get community by course id" endpoint, so this finds it client-side from the caller's full
 * membership list, matching the frontend checklist in the Community admin API doc.
 */
export function CourseCommunityTab({ courseId }: { courseId: string }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.userType === "ADMIN";
  const [membersOpen, setMembersOpen] = useState(false);

  const communitiesQuery = useQuery({
    queryKey: ["my_communities"],
    queryFn: listMyCommunities,
  });

  const community = communitiesQuery.data?.find((c) => c.type === "COURSE" && c.course_id === courseId);

  if (communitiesQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <IconSpinner className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  if (!community) {
    return (
      <EmptyState
        icon={IconMessageCircle}
        title="Class chat not available yet"
        description="This course's community should exist automatically — try refreshing, or check that you're enrolled/instructing on it."
      />
    );
  }

  return (
    <div className="h-[36rem] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <CommunityChatPanel
        communityId={community.id}
        communityName={community.name}
        courseId={courseId}
        memberCount={community.member_count}
        onOpenMembers={() => setMembersOpen(true)}
      />
      {membersOpen && (
        <CommunityMembersPanel community={community} isAdmin={isAdmin} onClose={() => setMembersOpen(false)} />
      )}
    </div>
  );
}
