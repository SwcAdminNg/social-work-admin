"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPageTitle } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { IconBell, IconLogout, IconMenu } from "./icons";
import { LogoutModal } from "./LogoutModal";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Quiz result is ready",
    detail: "Your “Child Safeguarding Basics” quiz has been graded.",
    time: "2h ago",
  },
  {
    id: 2,
    title: "New course material",
    detail: "A new module was added to your enrolled course.",
    time: "1d ago",
  },
  {
    id: 3,
    title: "Order confirmed",
    detail: "Your order #SWC-1042 has been confirmed.",
    time: "3d ago",
  },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const title = getPageTitle(pathname);

  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-[72px] flex items-center justify-between gap-3 px-4 sm:px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile sidebar trigger */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
          className="lg:hidden w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <IconMenu />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <IconBell />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#F4A261] ring-2 ring-white dark:ring-gray-900" />
          </button>

          <div
            className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl origin-top-right transition-all duration-150 ${
              notifOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Notifications
              </p>
              <span className="text-xs font-medium text-[#2D6A4F] dark:text-[#52b788]">
                {NOTIFICATIONS.length} new
              </span>
            </div>
            <ul className="list-none m-0 p-2 max-h-80 overflow-y-auto">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id}>
                  <button className="w-full text-left flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {n.detail}
                    </span>
                    <span className="text-[0.7rem] text-gray-400 dark:text-gray-600 mt-0.5">
                      {n.time}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          aria-label="Logout"
          title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <IconLogout />
        </button>
      </div>

      <LogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </header>
  );
}
