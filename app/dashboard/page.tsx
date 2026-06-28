import Link from "next/link";
import {
  IconBookOpen,
  IconClipboardCheck,
  IconReceipt,
  IconStar,
} from "@/components/dashboard/icons";

const STATS = [
  { label: "Enrolled Courses", value: 6, icon: IconBookOpen, href: "/dashboard/courses" },
  { label: "Quiz Attempts", value: 14, icon: IconClipboardCheck, href: "/dashboard/quiz-attempts" },
  { label: "Orders", value: 9, icon: IconReceipt, href: "/dashboard/orders" },
  { label: "Reviews Given", value: 3, icon: IconStar, href: "/dashboard/reviews" },
];

const ACTIVITY = [
  { title: "Completed “Ethics in Social Work” quiz", time: "Today, 9:42 AM" },
  { title: "Enrolled in “Child Safeguarding Basics”", time: "Yesterday, 4:10 PM" },
  { title: "Left a review for “Trauma-Informed Care”", time: "2 days ago" },
  { title: "Order #SWC-1042 confirmed", time: "3 days ago" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#2D6A4F] to-[#1e4d38] text-white shadow-lg shadow-green-900/20">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
          Welcome back
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
          Continue your learning journey
        </h2>
        <p className="text-sm text-white/80 max-w-md">
          Pick up where you left off, check your latest quiz results, or
          explore new courses tailored for social work practice in Nigeria.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 no-underline hover:border-[#2D6A4F]/40 dark:hover:border-[#52b788]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Icon />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
                {value}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                {label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 sm:p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <ul className="flex flex-col list-none m-0 p-0">
          {ACTIVITY.map((item, i) => (
            <li
              key={item.title}
              className={`flex items-center justify-between gap-4 py-3 ${
                i !== ACTIVITY.length - 1
                  ? "border-b border-gray-100 dark:border-gray-800"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#52b788] flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {item.title}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0 whitespace-nowrap">
                {item.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
