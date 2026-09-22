"use client";

import { Modal } from "@/components/generic/ui/Modal";
import type { CommunityMemberUser } from "@/lib/api/community.types";
import { Avatar, displayName, profileImageUrl } from "./Avatar";

function fullName(user: CommunityMemberUser | null): string {
  if (!user) return "Unknown user";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || displayName(user);
}

function roleLabel(user: CommunityMemberUser | null): string {
  const role = user?.user_type ?? user?.role;
  if (!role) return "Member";
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CommunityUserProfileModal({
  user,
  onClose,
}: {
  user: CommunityMemberUser | null;
  onClose: () => void;
}) {
  const name = fullName(user);
  const imageUrl = profileImageUrl(user);

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Member profile" maxWidth="sm">
      {user && (
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-[#2D6A4F]/15 blur-xl dark:bg-[#52b788]/20" />
            <div className="relative rounded-full ring-4 ring-white dark:ring-gray-900 shadow-lg">
              <Avatar user={user} size="xl" />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white break-words">{name}</h4>
            {user.username && (
              <p className="mt-1 text-sm font-medium text-[#2D6A4F] dark:text-[#52b788] break-all">
                @{user.username}
              </p>
            )}
          </div>

          <div className="mt-5 w-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Role
              </span>
              <span className="inline-flex self-start sm:self-auto items-center px-3 py-1 rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52b788]">
                {roleLabel(user)}
              </span>
            </div>
          </div>

          {!imageUrl && (
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Profile picture is not available for this member.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
