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
            <div className="absolute inset-0 rounded-full bg-brand-600/15 blur-xl dark:bg-brand-400/20" />
            <div className="relative rounded-full ring-4 ring-white dark:ring-ink-surface shadow-lg">
              <Avatar user={user} size="xl" />
            </div>
          </div>

          <div className="min-w-0 w-full">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white break-words">{name}</h4>
            {user.username && (
              <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400 break-all">
                @{user.username}
              </p>
            )}
          </div>

          <div className="mt-5 w-full rounded-2xl border border-slate-100 dark:border-ink-line bg-slate-50 dark:bg-ink-page/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Role
              </span>
              <span className="inline-flex self-start sm:self-auto items-center px-3 py-1 rounded-full bg-brand-600/10 dark:bg-brand-400/15 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {roleLabel(user)}
              </span>
            </div>
          </div>

          {!imageUrl && (
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Profile picture is not available for this member.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
