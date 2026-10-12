"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, ExternalLink, X, ZoomIn } from "lucide-react";

type AvatarUser = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  user_type?: string | null;
  profile_picture_url?: string | null;
};

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  xl: "h-20 w-20 text-2xl",
} as const;

function initials(user: AvatarUser) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function fullName(user: AvatarUser) {
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || "User";
}

/**
 * The user's profile picture, or their initials when they have none (or it
 * fails to load). When a picture exists, clicking it opens a larger preview.
 */
export function UserAvatar({
  user,
  size = "sm",
  className = "",
}: {
  user: AvatarUser;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const url = user.profile_picture_url || null;
  // A failure is remembered per URL, so a replaced picture gets a fresh attempt.
  const hasPicture = !!url && failedUrl !== url;

  const base = `${SIZES[size]} shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold`;

  if (!hasPicture) {
    return (
      <div
        aria-hidden
        className={`${base} bg-brand-600/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-400 ${className}`}
      >
        {initials(user)}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`View ${fullName(user)}'s profile picture`}
        className={`${base} group relative cursor-zoom-in ring-2 ring-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-brand-600 dark:ring-ink-surface ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url!}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 hidden place-items-center bg-slate-950/45 text-white group-hover:grid group-focus-visible:grid">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>
      <ProfilePhotoDialog user={user} url={url!} open={open} onOpenChange={setOpen} onError={() => setFailedUrl(url)} />
    </>
  );
}

function ProfilePhotoDialog({
  user,
  url,
  open,
  onOpenChange,
  onError,
}: {
  user: AvatarUser;
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: () => void;
}) {
  const name = fullName(user);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] animate-fade-in bg-slate-950/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 animate-pop-in overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] outline-none dark:bg-ink-surface"
        >
          <Dialog.Close
            aria-label="Close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-slate-950/50 text-white backdrop-blur transition-colors hover:bg-slate-950/70"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>

          <div className="bg-slate-100 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${name}'s profile picture`}
              referrerPolicy="no-referrer"
              onError={() => {
                onError();
                onOpenChange(false);
              }}
              className="mx-auto max-h-[68vh] w-full object-contain"
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate font-display text-base font-bold text-slate-900 dark:text-white">
                {name}
              </Dialog.Title>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {[user.user_type, user.email].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open original in a new tab"
                title="Open original"
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-ink-line dark:text-slate-300 dark:hover:bg-white/5"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download picture"
                title="Download"
                className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-ink-line dark:text-slate-300 dark:hover:bg-white/5"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
