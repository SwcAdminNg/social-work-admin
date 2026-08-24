"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePresenceHeartbeat } from "@/lib/hooks/usePresenceHeartbeat";

const ALL_TABS = [
  { label: "Tickets", href: "/dashboard/help-support/tickets", adminOnly: false },
  { label: "FAQ", href: "/dashboard/help-support/faq", adminOnly: true },
];

export default function HelpSupportLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.userType === "ADMIN";
  const tabs = ALL_TABS.filter((tab) => !tab.adminOnly || isAdmin);
  usePresenceHeartbeat(true);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Help &amp; Support
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage the support ticket queue{isAdmin ? " and the public FAQ content" : ""}.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${
                active
                  ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
