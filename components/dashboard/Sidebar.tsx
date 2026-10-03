"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronsLeft, LogOut, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/generic/ThemeProvider";
import { UnreadBadge } from "@/components/community-admin/UnreadBadge";
import { canShowNavItem, dashboardNavGroups, type NavItem } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { LogoutModal } from "./LogoutModal";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ROW =
  "group relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium no-underline transition-all duration-150";
const ROW_IDLE =
  "text-slate-700 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-brand-400/12 dark:hover:text-brand-200";

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const compact = collapsed ? "lg:hidden" : "";

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`${ROW} ${
        active
          ? "bg-brand-600 text-white shadow-[0_10px_24px_-16px_rgba(45,106,79,0.85)] dark:bg-brand-400 dark:text-[#06130d]"
          : ROW_IDLE
      } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
    >
      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <span className={`min-w-0 truncate ${compact}`}>{item.label}</span>
      {item.href === "/dashboard/communities" && (
        <UnreadBadge className={collapsed ? "lg:absolute lg:-right-1 lg:-top-1 lg:h-4 lg:min-w-4 lg:px-1" : ""} />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mobileOpen, setMobileOpen, collapsed, toggleCollapsed } =
    useSidebar();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const userType = session?.user?.userType;
  const compact = collapsed ? "lg:hidden" : "";

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#e5e3ee] bg-white shadow-[16px_0_40px_-38px_rgba(18,24,40,0.45)] transition-all duration-300 ease-in-out dark:border-ink-line dark:bg-ink-surface dark:shadow-none
          ${collapsed ? "lg:w-[78px]" : "lg:w-[252px]"}
          w-[252px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-24 flex-shrink-0 items-center justify-between gap-2 px-4">
          <Link
            href="/dashboard"
            className={`flex min-w-0 items-center overflow-hidden no-underline ${collapsed ? "lg:hidden" : ""}`}
            aria-label="Social Work Nigeria admin home"
          >
            <div className="relative h-24 w-[180px] overflow-hidden">
              <Image
                src="/images/swc-dark-logo.png"
                alt="SWC Logo"
                width={220}
                height={96}
                priority
                className="h-24 w-[220px] max-w-none origin-left scale-125 object-contain object-left"
              />
            </div>
          </Link>

          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            className={`hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:flex ${collapsed ? "lg:hidden" : ""}`}
          >
            <ChevronsLeft className="h-[18px] w-[18px]" />
          </button>

          {/* Collapsed: compact admin mark */}
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className={`mx-auto hidden h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-extrabold text-white transition hover:bg-brand-700 dark:bg-brand-400 dark:text-[#06130d] ${collapsed ? "lg:flex" : ""}`}
          >
            SW
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`-mt-3 mb-3 px-5 ${compact}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-brand-700 ring-1 ring-inset ring-brand-200/70 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Admin console
          </span>
        </div>

        {/* Nav items */}
        <nav className="swcl-sidebar-scroll flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex flex-col gap-4">
            {dashboardNavGroups.map((group, index) => {
              const items = group.items.filter((item) =>
                canShowNavItem(item, userType),
              );
              if (!items.length) return null;
              return (
                <section key={group.label ?? `primary-${index}`}>
                  {group.label && (
                    <p
                      className={`mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-slate-500 ${compact}`}
                    >
                      {group.label}
                    </p>
                  )}
                  {group.label && collapsed && (
                    <div className="mx-3 mb-2 hidden h-px bg-slate-100 dark:bg-ink-line lg:block" />
                  )}
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {items.map((item) => (
                      <li key={item.href}>
                        <NavLink
                          item={item}
                          active={isActive(pathname, item.href)}
                          collapsed={collapsed}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </nav>

        {/* Collapse toggle (desktop, collapsed state only) */}
        <button
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className={`mx-3 mb-2 hidden h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white ${collapsed ? "lg:flex" : ""}`}
        >
          <ChevronsLeft className="h-[18px] w-[18px] rotate-180" />
        </button>

        {/* Logout & theme */}
        <div className="flex-shrink-0 space-y-1 border-t border-[#eceaf4] px-3 pb-4 pt-3 dark:border-ink-line">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            title={collapsed ? "Logout" : undefined}
            className={`${ROW} cursor-pointer text-left text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-500/10 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
            <span className={`whitespace-nowrap ${compact}`}>Logout</span>
          </button>
          <SidebarThemeToggle collapsed={collapsed} />
        </div>
      </aside>

      <LogoutModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </>
  );
}

function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const compact = collapsed ? "lg:hidden" : "";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
      className={`mt-3 flex h-10 w-full cursor-pointer items-center gap-3 rounded-md border border-[#dceee4] bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-brand-200 hover:bg-[#f7fcf9] dark:border-[#27433a] dark:bg-[#13231d] dark:text-slate-100 dark:hover:border-brand-500 dark:hover:bg-[#183026] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-brand-600 dark:text-brand-400">
        {isDark ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.9} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        )}
      </span>
      <span className={`min-w-0 flex-1 text-left ${compact}`}>Dark mode</span>
      <span
        className={`flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${compact} ${
          isDark ? "justify-end bg-brand-400" : "justify-start bg-slate-200"
        }`}
        aria-hidden="true"
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm transition-all" />
      </span>
    </button>
  );
}
