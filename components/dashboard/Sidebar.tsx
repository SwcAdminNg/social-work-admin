"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { IconLogoMark } from "@/components/auth/shared/icons";
import { dashboardNavItems } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { IconChevronsLeft, IconClose, IconLogout } from "./icons";
import { LogoutModal } from "./LogoutModal";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mobileOpen, setMobileOpen, collapsed, toggleCollapsed } =
    useSidebar();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const isAdmin = session?.user?.userType === "ADMIN";
  const visibleNavItems = dashboardNavItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-[84px]" : "lg:w-72"}
          w-72
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 h-[84px] px-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 no-underline overflow-hidden"
            aria-label="Social Work Nigeria dashboard home"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center flex-shrink-0">
              <IconLogoMark />
            </div>
            <div
              className={`leading-tight transition-opacity duration-200 whitespace-nowrap ${collapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"}`}
            >
              <p className="text-gray-900 dark:text-white font-bold text-[0.9rem]">
                Social Work Nigeria
              </p>
              <p className="text-[#2D6A4F] dark:text-[#52b788] text-[0.6rem] uppercase tracking-widest font-semibold">
                ADMIN PANEL
              </p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <IconClose />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <ul className="flex flex-col gap-1 list-none m-0 p-0">
            {visibleNavItems.map(({ label, href, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-colors duration-150
                      ${
                        active
                          ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" />
                    )}
                    <span className="flex-shrink-0">
                      <Icon />
                    </span>
                    <span
                      className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? "lg:hidden" : ""}`}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
        >
          <span
            className={`flex-shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <IconChevronsLeft />
          </span>
          <span className={collapsed ? "hidden" : ""}>Collapse</span>
        </button>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-gray-100 dark:border-gray-800 pt-3 flex-shrink-0">
          <button
            onClick={() => setLogoutModalOpen(true)}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 no-underline transition-colors duration-150 cursor-pointer"
          >
            <span className="flex-shrink-0">
              <IconLogout />
            </span>
            <span
              className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      <LogoutModal open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </>
  );
}
