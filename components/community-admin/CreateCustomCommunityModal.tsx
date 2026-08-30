"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/generic/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { createCustomCommunity } from "@/lib/api/community-client";
import type { Community } from "@/lib/api/community.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { UserPicker, type PickedUser } from "./UserPicker";
import { CoursePicker, type PickedCourse } from "./CoursePicker";

export function CreateCustomCommunityModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (community: Community) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<PickedUser[]>([]);
  const [courses, setCourses] = useState<PickedCourse[]>([]);

  function reset() {
    setName("");
    setDescription("");
    setUsers([]);
    setCourses([]);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createCustomCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        user_ids: users.map((u) => u.id),
        course_snapshot_ids: courses.map((c) => c.id),
      }),
    onSuccess: (community) => {
      toast.success(`"${community.name}" created.`);
      queryClient.invalidateQueries({ queryKey: ["my_communities"] });
      queryClient.invalidateQueries({ queryKey: ["custom_communities"] });
      onCreated?.(community);
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to create community.");
    },
  });

  const canSubmit = name.trim().length > 0 && (users.length > 0 || courses.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New custom community"
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) createMutation.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. March 2026 Cohort Leads"
            maxLength={255}
            required
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Description <span className="font-normal normal-case text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white"
          />
        </div>

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
          <CoursePicker value={courses} onChange={setCourses} multiple />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            This copies in whoever is enrolled or instructing right now — a one-time snapshot,
            not a live sync. New enrollees won&apos;t be added automatically.
          </p>
        </div>

        {!canSubmit && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Add at least one person or course, and give the community a name.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending && <IconSpinner className="w-4 h-4" />}
            Create community
          </button>
        </div>
      </form>
    </Modal>
  );
}
