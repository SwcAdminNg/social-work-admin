import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpenCheck,
  FileCheck2,
  FolderTree,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Mail,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  UsersRound,
  UserRoundCog,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Visible to ADMIN and INSTRUCTOR accounts. Backend ownership/group checks still decide exact access. */
  staffOnly?: boolean;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const dashboardNavGroups: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      {
        label: "Course Management",
        href: "/dashboard/course-management",
        icon: BookOpenCheck,
        adminOnly: true,
      },
      {
        label: "Approval Centre",
        href: "/dashboard/approval-centre",
        icon: FileCheck2,
        staffOnly: true,
      },
      {
        label: "Featured Courses",
        href: "/dashboard/featured-courses",
        icon: Sparkles,
        adminOnly: true,
      },
      {
        label: "Course Catalogs",
        href: "/dashboard/course-catalogs",
        icon: FolderTree,
        adminOnly: true,
      },
      {
        label: "Resource Management",
        href: "/dashboard/resource-management",
        icon: Library,
        staffOnly: true,
      },
      {
        label: "Certificates",
        href: "/dashboard/certificates",
        icon: BadgeCheck,
        staffOnly: true,
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      {
        label: "Communities",
        href: "/dashboard/communities",
        icon: MessagesSquare,
      },
      { label: "Reviews", href: "/dashboard/reviews", icon: Star },
      {
        label: "Help & Support",
        href: "/dashboard/help-support",
        icon: LifeBuoy,
        staffOnly: true,
      },
      {
        label: "Contact Messages",
        href: "/dashboard/contact-messages",
        icon: Mail,
        adminOnly: true,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "User Management",
        href: "/dashboard/user-management",
        icon: UsersRound,
        adminOnly: true,
      },
      {
        label: "Staff Roles",
        href: "/dashboard/staff-roles",
        icon: ShieldCheck,
        adminOnly: true,
      },
      {
        label: "Instructor Applications",
        href: "/dashboard/instructor-applications",
        icon: UserPlus,
        adminOnly: true,
      },
      {
        label: "Groups",
        href: "/dashboard/groups",
        icon: UserRoundCog,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Payments",
        href: "/dashboard/payments",
        icon: Wallet,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

export const dashboardNavItems = dashboardNavGroups.flatMap(
  (group) => group.items,
);

export function canShowNavItem(item: NavItem, userType?: string) {
  const isAdmin = userType === "ADMIN";
  const isStaff = isAdmin || userType === "INSTRUCTOR";
  return (!item.adminOnly || isAdmin) && (!item.staffOnly || isStaff);
}

/** Titles for nested routes that aren't nav entries (most specific first). */
const NESTED_TITLES: [RegExp, string][] = [
  [/^\/dashboard\/course-management\/new\/?$/, "New course"],
  [/^\/dashboard\/course-management\/[^/]+/, "Course editor"],
  [/^\/dashboard\/resource-management\/new\/?$/, "New resource"],
  [/^\/dashboard\/resource-management\/[^/]+/, "Resource editor"],
  [/^\/dashboard\/certificates\/new\/?$/, "New certificate template"],
  [/^\/dashboard\/approval-centre\/revisions\/[^/]+/, "Review"],
  [/^\/dashboard\/approval-centre\/marks\/[^/]+/, "Essay mark"],
  [/^\/dashboard\/profile\/?$/, "Profile"],
];

export function getPageTitle(pathname: string): string {
  const exact = dashboardNavItems.find((item) => item.href === pathname);
  if (exact) return exact.label;

  const special = NESTED_TITLES.find(([re]) => re.test(pathname));
  if (special) return special[1];

  const nested = dashboardNavItems
    .filter(
      (item) => item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return nested?.label ?? "Dashboard";
}
