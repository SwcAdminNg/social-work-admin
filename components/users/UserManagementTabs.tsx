"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const USER_GROUPS = [
  { key: "admins", label: "Admins", href: "/dashboard/user-management/admins" },
  { key: "instructors", label: "Instructors", href: "/dashboard/user-management/instructors" },
  { key: "students", label: "Students", href: "/dashboard/user-management/students" },
] as const;

/** Switcher between the three user lists (admins, instructors, students). */
export function UserManagementTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="User groups" className="inline-flex self-start rounded-xl bg-slate-100 p-1 dark:bg-ink-surface">
      {USER_GROUPS.map((group) => {
        const active = pathname === group.href;
        return (
          <Link
            key={group.key}
            href={group.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold no-underline transition-colors ${
              active
                ? "bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {group.label}
          </Link>
        );
      })}
    </nav>
  );
}
