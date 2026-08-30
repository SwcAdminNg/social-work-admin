"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/generic/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { addCommunityMembers } from "@/lib/api/community-client";
import { IconSpinner } from "@/components/dashboard/icons";
import { UserPicker, type PickedUser } from "./UserPicker";
import { CoursePicker, type PickedCourse } from "./CoursePicker";

export function AddMembersModal({
  isOpen,
  onClose,
  communityId,
  prefillCourse,
}: {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  /** Pre-fills the course field for a one-click "re-sync" of an already-snapshotted course. */
  prefillCourse?: PickedCourse | null;
}) {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<PickedUser[]>([]);
  const [course, setCourse] = useState<PickedCourse[]>([]);

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setCourse(prefillCourse ? [prefillCourse] : []);
    }
  }, [isOpen, prefillCourse]);

  const addMutation = useMutation({
    mutationFn: () =>
      addCommunityMembers(communityId, {
        user_ids: users.map((u) => u.id),
        course_snapshot_id: course[0]?.id,
      }),
    onSuccess: () => {
      toast.success("Members added.");
      queryClient.invalidateQueries({ queryKey: ["community_members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to add members.");
    },
  });

  const canSubmit = users.length > 0 || course.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add members" maxWidth="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) addMutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Add specific people
          </label>
          <UserPicker value={users} onChange={setUsers} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Snapshot a course&apos;s enrollees
          </label>
          <CoursePicker value={course} onChange={setCourse} multiple={false} />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            One-time copy of who&apos;s enrolled or instructing right now. Already-existing
            members are skipped — no duplicates.
          </p>
        </div>

        {!canSubmit && (
          <p className="text-xs text-amber-600 dark:text-amber-400">Add at least one person or course.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || addMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMutation.isPending && <IconSpinner className="w-4 h-4" />}
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}
