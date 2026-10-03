"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, LogOut, Menu, MessageSquare, Settings } from "lucide-react";
import { badgeLabel, useCommunityUnreadCount } from "@/components/community-admin/UnreadBadge";
import { getPageTitle } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { LogoutModal } from "./LogoutModal";
import { NotificationCenter } from "./NotificationCenter";

const HEADER_BUTTON =
  "flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-400/12 dark:hover:text-brand-200";

function roleLabel(userType?: string) {
  if (userType === "ADMIN") return "Platform admin";
  if (userType === "INSTRUCTOR") return "Instructor";
  return userType ? userType.charAt(0) + userType.slice(1).toLowerCase() : "Admin";
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setMobileOpen, toggleCollapsed } = useSidebar();
  const unreadMessages = useCommunityUnreadCount();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const title = getPageTitle(pathname);
  const user = session?.user;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Admin";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "A";
  const avatarUrl = user?.image;
  const avatarImageUrl = avatarUrl && avatarUrl !== failedAvatarUrl ? avatarUrl : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[72px] flex-shrink-0 items-center justify-between gap-3 border-b border-[#e5e3ee] bg-white/90 px-4 backdrop-blur-xl dark:border-ink-line dark:bg-ink-surface/90 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
            className={`${HEADER_BUTTON} lg:hidden`}
          >
            <Menu className="h-5 w-5" strokeWidth={1.9} />
          </button>

          <button
            onClick={toggleCollapsed}
            aria-label="Toggle sidebar"
            className={`${HEADER_BUTTON} hidden lg:flex`}
          >
            <Menu className="h-5 w-5" strokeWidth={1.9} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white sm:text-base">
              {title}
            </p>
            <p className="hidden truncate text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
              Admin Dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          <NotificationCenter />

          <Link
            href="/dashboard/communities"
            aria-label="Messages"
            className={`${HEADER_BUTTON} relative hidden no-underline sm:flex`}
          >
            <MessageSquare className="h-5 w-5" strokeWidth={1.9} />
            {unreadMessages > 0 && (
              <span className="absolute -right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white dark:ring-ink-surface">
                {badgeLabel(unreadMessages)}
              </span>
            )}
          </Link>

          <div className="relative ml-1 sm:ml-2" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              aria-label="Account menu"
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none transition-colors hover:bg-brand-50 dark:hover:bg-brand-400/12 sm:gap-3 sm:px-2"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-600 text-sm font-extrabold text-white shadow-[0_10px_22px_-15px_rgba(45,106,79,0.9)] dark:bg-brand-400 dark:text-[#06130d]">
                {avatarImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setFailedAvatarUrl(avatarImageUrl)}
                  />
                ) : (
                  avatarInitial
                )}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                <span className="max-w-40 truncate text-sm font-extrabold text-slate-950 dark:text-white">
                  {displayName}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {roleLabel(user?.userType)}
                </span>
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 lg:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>

            <div
              hidden={!profileOpen}
              className={`absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-lg border border-[#e5e3ee] bg-white shadow-xl transition-all duration-150 dark:border-ink-line dark:bg-ink-surface ${
                profileOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-1 border-b border-[#eceaf4] p-4 dark:border-ink-line">
                <p className="truncate font-extrabold text-slate-950 dark:text-white">{displayName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || "No email provided"}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-slate-700 no-underline transition-colors hover:bg-[#f7fcf9] hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-400/12 dark:hover:text-brand-200"
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Account settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <LogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </>
  );
}
