"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { getUsers } from "@/lib/api/users";
import { User, UsersApiResponse } from "@/lib/api/users.types";
import { CustomDropdown } from "@/components/generic/ui/CustomDropdown";
import { Pagination } from "@/components/generic/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconSearch, IconUsers } from "@/components/dashboard/icons";

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: "NG", label: "NG" },
  { value: "COM", label: "COM" },
];

const userTypeOptions = [
  { value: "all", label: "All User Types" },
  { value: "USER", label: "User" },
  { value: "INSTRUCTOR", label: "Instructor" },
  { value: "ADMIN", label: "Admin" },
];

const ROLE_STYLES: Record<User["user_type"], string> = {
  ADMIN: "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]",
  INSTRUCTOR: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  USER: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function RoleBadge({ userType }: { userType: User["user_type"] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${ROLE_STYLES[userType]}`}
    >
      {userType}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: User["platform"] }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      {platform}
    </span>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${
        isActive
          ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#2D6A4F] dark:bg-[#52b788]" : "bg-red-500"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function initials(user: User) {
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 shrink-0 rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] flex items-center justify-center text-xs font-bold">
        {initials(user)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
      </div>
    </div>
  );
}

export function UserList() {
  const { data: session } = useSession();
  const [users, setUsers] = React.useState<User[]>([]);
  const [meta, setMeta] = React.useState<UsersApiResponse["meta"] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [platform, setPlatform] = React.useState("all");
  const [userType, setUserType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  React.useEffect(() => {
    const fetchUsers = async () => {
      if (!session) return;

      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          platform: platform === "all" ? undefined : (platform as "NG" | "COM"),
          userType: userType === "all" ? undefined : (userType as "USER" | "INSTRUCTOR" | "ADMIN"),
          search: searchTerm,
        };
        const response = await getUsers(params);
        setUsers(response.data);
        setMeta(response.meta);
      } catch (err) {
        setError("Failed to fetch users. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceFetch);
  }, [session, page, platform, userType, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(search);
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => <UserIdentity user={user} />,
      hideInCard: true,
    },
    {
      key: "platform",
      header: "Platform",
      render: (user) => <PlatformBadge platform={user.platform} />,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => <RoleBadge userType={user.user_type} />,
    },
    {
      key: "status",
      header: "Status",
      render: (user) => <ActiveBadge isActive={user.is_active} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          User Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          A list of all the users in your account including their name, title, email and role.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email…"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </form>

        <div className="w-full sm:w-52">
          <CustomDropdown
            options={platformOptions}
            value={platform}
            onChange={(v) => {
              setPlatform(v);
              setPage(1);
            }}
            ariaLabel="Filter by platform"
          />
        </div>

        <div className="w-full sm:w-52">
          <CustomDropdown
            options={userTypeOptions}
            value={userType}
            onChange={(v) => {
              setUserType(v);
              setPage(1);
            }}
            ariaLabel="Filter by user type"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && (
        <div className={`transition-opacity duration-200 ${loading && users.length > 0 ? "opacity-60" : ""}`}>
          <DataTable
            columns={columns}
            data={users}
            keyExtractor={(user) => user.id}
            loading={loading && users.length === 0}
            skeletonRows={6}
            cardTitle={(user) => <UserIdentity user={user} />}
            emptyState={
              <EmptyState
                icon={IconUsers}
                title="No users found"
                description="Try adjusting your search or filters."
              />
            }
          />
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <Pagination currentPage={page} totalPages={meta.total_pages} onPageChange={setPage} />
      )}
    </div>
  );
}
