"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listCommunityMembers, removeCommunityMember } from "@/lib/api/community-client";
import type { Community, CommunityMember } from "@/lib/api/community.types";
import { Pagination } from "@/components/generic/ui/Pagination";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { IconClose, IconRefresh, IconSpinner, IconTrash, IconUserPlus } from "@/components/dashboard/icons";
import { Avatar, displayName } from "./Avatar";
import { AddMembersModal } from "./AddMembersModal";
import type { PickedCourse } from "./CoursePicker";

const PAGE_SIZE = 20;

function AddedViaBadge({ member }: { member: CommunityMember }) {
  if (!member.added_via) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      {member.added_via === "COURSE_SNAPSHOT" ? "Course snapshot" : "Added manually"}
    </span>
  );
}

export function CommunityMembersPanel({
  community,
  isAdmin,
  onClose,
}: {
  community: Community;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [removeTarget, setRemoveTarget] = useState<CommunityMember | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [resyncCourse, setResyncCourse] = useState<PickedCourse | null>(null);

  const isCustom = community.type === "CUSTOM";
  const canManage = isAdmin && isCustom;

  const membersQuery = useQuery({
    queryKey: ["community_members", community.id, page],
    queryFn: () => listCommunityMembers(community.id, page, PAGE_SIZE),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeCommunityMember(community.id, userId),
    onSuccess: () => {
      toast.success("Member removed.");
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["community_members", community.id] });
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove member.");
    },
  });

  const members = membersQuery.data?.items ?? [];
  const meta = membersQuery.data?.meta;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Members</h3>
              <p className="text-xs text-gray-400">{meta?.total_items ?? community.member_count ?? "—"} total</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              aria-label="Close"
            >
              <IconClose />
            </button>
          </div>

          {canManage && (
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setResyncCourse(null);
                  setAddOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 hover:bg-[#2D6A4F]/20 dark:hover:bg-[#52b788]/25 rounded-xl transition-colors cursor-pointer w-full justify-center"
              >
                <IconUserPlus />
                Add members
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
            {membersQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <IconSpinner className="w-5 h-5 text-gray-400" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No members yet.</p>
            ) : (
              members.map((member) => (
                <div key={member.user.id} className="flex items-center gap-3">
                  <Avatar user={member.user} isOnline={member.is_online} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {displayName(member.user)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {member.user.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                      )}
                      <AddedViaBadge member={member} />
                    </div>
                  </div>
                  {canManage && member.added_via === "COURSE_SNAPSHOT" && member.added_from_course_id && (
                    <button
                      type="button"
                      title="Re-sync this course's current enrollees"
                      onClick={() => {
                        setResyncCourse({ id: member.added_from_course_id as string, title: "this course" });
                        setAddOpen(true);
                      }}
                      className="text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] cursor-pointer shrink-0"
                    >
                      <IconRefresh className="w-4 h-4" />
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(member)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer shrink-0"
                      aria-label={`Remove ${displayName(member.user)}`}
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {meta && meta.total_pages > 1 && (
            <Pagination currentPage={meta.page} totalPages={meta.total_pages} onPageChange={setPage} />
          )}
        </div>
      </div>

      {canManage && (
        <AddMembersModal
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          communityId={community.id}
          prefillCourse={resyncCourse}
        />
      )}

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.user.id)}
        title="Remove member"
        description={`Remove ${removeTarget ? displayName(removeTarget.user) : "this member"} from ${community.name}?`}
        confirmText="Remove"
        isDestructive
        isLoading={removeMutation.isPending}
      />
    </>
  );
}
