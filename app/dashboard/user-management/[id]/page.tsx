"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserTransactions, getUserCourses, getUserCards } from "@/lib/api/customer-support";
import { getUserDetails } from "@/lib/api/users";
import { IconReceipt, IconBookOpen, IconLock } from "@/components/dashboard/icons";
import { DataTable } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/generic/ui/Pagination";

const PAGE_SIZE = 20;

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Success</span>;
  }
  if (status === "FAILED") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Failed</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">Pending</span>;
}

export default function UserProfilePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const userId = params.id;
  const [tab, setTab] = React.useState<"transactions" | "courses" | "cards">("transactions");
  const [page, setPage] = React.useState(1);

  // Reset page when tab changes
  React.useEffect(() => { setPage(1); }, [tab]);

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["user_transactions", userId, page],
    queryFn: () => getUserTransactions(userId, page, PAGE_SIZE),
    enabled: tab === "transactions",
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["user_courses", userId, page],
    queryFn: () => getUserCourses(userId, page, PAGE_SIZE),
    enabled: tab === "courses",
  });

  const { data: cardsData, isLoading: cardsLoading } = useQuery({
    queryKey: ["user_cards", userId],
    queryFn: () => getUserCards(userId),
    enabled: tab === "cards",
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user_details", userId],
    queryFn: () => getUserDetails(userId),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={() => router.back()} className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors">
          &larr; Back to Users
        </button>
      </div>

      <div className="flex flex-col gap-2 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "User Profile"}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
          {user?.email && (
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{user.email}</span>
            </div>
          )}
          {user?.username && (
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">Username</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">@{user.username}</span>
            </div>
          )}
          {user?.phone_number && (
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">Phone</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">{user.phone_number}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">User ID</span>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{userId}</span>
          </div>
          {user && (
            <div className="flex flex-col">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-gray-500">Status</span>
              <span className="mt-0.5">
                {user.is_suspended ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Suspended</span>
                ) : user.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start">
        <button
          onClick={() => setTab("transactions")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "transactions" ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
        >
          Transactions
        </button>
        <button
          onClick={() => setTab("courses")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "courses" ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
        >
          Courses
        </button>
        <button
          onClick={() => setTab("cards")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "cards" ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
        >
          Cards
        </button>
      </div>

      {tab === "transactions" && (
        <div className="flex flex-col gap-4">
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (t) => <span className="text-sm">{formatDate(t.created_at)}</span> },
              { key: "reference", header: "Ref", render: (t) => <span className="text-sm font-mono">{t.reference}</span> },
              { key: "amount", header: "Amount", render: (t) => <span className="text-sm font-semibold">₦{t.amount.toLocaleString()}</span> },
              { key: "type", header: "Type", render: (t) => <span className="text-xs text-gray-500">{t.transaction_type}</span> },
              { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
            ]}
            data={txData?.items ?? []}
            keyExtractor={(t) => t.id}
            loading={txLoading}
            emptyState={<EmptyState icon={IconReceipt} title="No transactions" description="User has no transactions yet." />}
          />
          {txData && txData.total_pages > 1 && <Pagination currentPage={page} totalPages={txData.total_pages} onPageChange={setPage} />}
        </div>
      )}

      {tab === "courses" && (
        <div className="flex flex-col gap-4">
          <DataTable
            columns={[
              { key: "title", header: "Course Title", render: (c) => <span className="text-sm font-semibold">{c.title}</span> },
              { key: "category", header: "Category", render: (c) => <span className="text-xs text-gray-500">{c.category}</span> },
              { key: "level", header: "Level", render: (c) => <span className="text-xs text-gray-500">{c.level}</span> },
            ]}
            data={coursesData?.items ?? []}
            keyExtractor={(c) => c.id}
            loading={coursesLoading}
            emptyState={<EmptyState icon={IconBookOpen} title="No courses" description="User is not enrolled in any courses." />}
          />
          {coursesData && coursesData.total_pages > 1 && <Pagination currentPage={page} totalPages={coursesData.total_pages} onPageChange={setPage} />}
        </div>
      )}

      {tab === "cards" && (
        <div className="flex flex-col gap-4">
          {cardsLoading ? (
            <div className="animate-pulse flex gap-4">
              <div className="h-20 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : cardsData?.length === 0 ? (
            <EmptyState icon={IconLock} title="No saved cards" description="User has no saved payment methods." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cardsData?.map((card) => (
                <div key={card.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase text-gray-700 dark:text-gray-300">{card.card_type}</span>
                    <span className="text-xs text-gray-500">{card.gateway}</span>
                  </div>
                  <div className="text-lg font-mono font-medium tracking-widest text-gray-900 dark:text-white">
                    **** **** **** {card.last4}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Expires {card.exp_month}/{card.exp_year}</span>
                    <span>{card.bank || "Unknown Bank"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
