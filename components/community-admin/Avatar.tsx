"use client";

import type { CommunityMemberUser } from "@/lib/api/community.types";

function initials(user: CommunityMemberUser | null | undefined): string {
  if (!user) return "?";
  const fromName = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  if (fromName) return fromName;
  return (user.username?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
}

export function displayName(user: CommunityMemberUser | null | undefined): string {
  if (!user) return "Unknown";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.username || user.email || "Unknown";
}

const SIZE_CLASSES = {
  sm: "w-7 h-7 text-[0.65rem]",
  md: "w-9 h-9 text-xs",
  lg: "w-11 h-11 text-sm",
};

export function Avatar({
  user,
  size = "md",
  isOnline,
}: {
  user: CommunityMemberUser | null | undefined;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={`${SIZE_CLASSES[size]} rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center font-bold`}
      >
        {initials(user)}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
            isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
