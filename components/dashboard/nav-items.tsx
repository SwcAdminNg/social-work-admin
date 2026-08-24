import {
  IconBookOpen,
  IconCertificate,
  IconGrid,
  IconReceipt,
  IconSettings,
  IconSparkles,
  IconStar,
  IconUsers,
  IconFolder,
  IconMail,
  IconLifeBuoy,
  IconClipboardCheck,
} from "./icons";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType;
  adminOnly?: boolean;
  /** Visible to ADMIN users and to INSTRUCTOR users, since instructors can be granted staff
   *  access (e.g. to Help & Support) via group membership without changing their account type. */
  staffOnly?: boolean;
};

export const dashboardNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconGrid },
  {
    label: "Course Management",
    href: "/dashboard/course-management",
    icon: IconBookOpen,
    adminOnly: true,
  },
  {
    label: "Featured Courses",
    href: "/dashboard/featured-courses",
    icon: IconSparkles,
    adminOnly: true,
  },
  {
    label: "Course Catalogs",
    href: "/dashboard/course-catalogs",
    icon: IconFolder,
    adminOnly: true,
  },
  {
    label: "Certificates",
    href: "/dashboard/certificates",
    icon: IconCertificate,
    adminOnly: true,
  },
  {
    label: "Contact Messages",
    href: "/dashboard/contact-messages",
    icon: IconMail,
    adminOnly: true,
  },
  {
    label: "Help & Support",
    href: "/dashboard/help-support",
    icon: IconLifeBuoy,
    staffOnly: true,
  },
  {
    label: "User Management",
    href: "/dashboard/user-management",
    icon: IconUsers,
    adminOnly: true,
  },
  {
    label: "Groups",
    href: "/dashboard/groups",
    icon: IconClipboardCheck,
    adminOnly: true,
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: IconReceipt,
    adminOnly: true,
  },
  { label: "Reviews", href: "/dashboard/reviews", icon: IconStar },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

export function getPageTitle(pathname: string): string {
  const exact = dashboardNavItems.find((item) => item.href === pathname);
  if (exact) return exact.label;

  const nested = dashboardNavItems
    .filter(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return nested?.label ?? "Dashboard";
}
