"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, suspendUser, unsuspendUser, changeUserRole } from "@/lib/api/users";
import { User } from "@/lib/api/users.types";
import { CustomDropdown } from "@/components/generic/ui/CustomDropdown";
import { Pagination } from "@/components/generic/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconSearch, IconUsers } from "@/components/dashboard/icons";
import { InviteAdminModal } from "./InviteAdminModal";
import { ChangeRoleModal } from "./ChangeRoleModal";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "Never logged in";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const PAGE_SIZE = 10;

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

function ActiveBadge({ isActive, isSuspended }: { isActive: boolean; isSuspended?: boolean }) {
  if (isSuspended) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Suspended
      </span>
    );
  }
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
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          <span className="text-[0.65rem] text-gray-400 dark:text-gray-500 hidden sm:inline-block">• Last active: {formatTimeAgo(user.last_login_at)}</span>
        </div>
      </div>
    </div>
  );
}

function UserActions({ 
  user, 
  onOpenRoleModal, 
  onConfirmAction 
}: { 
  user: User; 
  onOpenRoleModal: (user: User) => void;
  onConfirmAction: (type: "suspend" | "unsuspend", user: User) => void;
}) {

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden"
        >
          {user.is_suspended ? (
            <DropdownMenu.Item asChild>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                onClick={() => onConfirmAction("unsuspend", user)}
              >
                Unsuspend
              </button>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item asChild>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                onClick={() => onConfirmAction("suspend", user)}
              >
                Suspend
              </button>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
          <DropdownMenu.Item asChild>
            <Link
              href={`/dashboard/user-management/${user.id}`}
              className="w-full flex text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
            >
              View Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
              onClick={() => onOpenRoleModal(user)}
            >
              Change Role
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function UserList() {
  const { data: session } = useSession();

  const [page, setPage] = React.useState(1);
  const [platform, setPlatform] = React.useState("all");
  const [userType, setUserType] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [roleModalUser, setRoleModalUser] = React.useState<User | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<{ type: "suspend" | "unsuspend"; user: User } | null>(null);

  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => suspendUser(userId),
    onSuccess: () => {
      toast.success("User suspended");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => unsuspendUser(userId),
    onSuccess: () => {
      toast.success("User unsuspended");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const queryParams = {
    page,
    pageSize: PAGE_SIZE,
    platform: platform === "all" ? undefined : (platform as "NG" | "COM"),
    userType: userType === "all" ? undefined : (userType as "USER" | "INSTRUCTOR" | "ADMIN"),
    search: searchTerm || undefined,
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => getUsers(queryParams),
    enabled: !!session,
    placeholderData: keepPreviousData,
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? null;

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
      render: (user) => <ActiveBadge isActive={user.is_active} isSuspended={user.is_suspended} />,
    },
    {
      key: "actions",
      header: "",
      render: (user) => (
        <UserActions 
          user={user} 
          onOpenRoleModal={setRoleModalUser} 
          onConfirmAction={(type, u) => setConfirmAction({ type, user: u })} 
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A list of all the users in your account including their name, title, email and role.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors shadow-sm shrink-0"
        >
          Invite Admin
        </button>
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

      {isError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
          Failed to fetch users. Please try again later.
        </div>
      )}

      {!isError && (
        <div className={`transition-opacity duration-200 ${isFetching && users.length > 0 ? "opacity-60" : ""}`}>
          <DataTable
            columns={columns}
            data={users}
            keyExtractor={(user) => user.id}
            loading={isLoading}
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

      <InviteAdminModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
      <ChangeRoleModal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        user={roleModalUser}
      />
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === "suspend") {
            suspendMutation.mutate(confirmAction.user.id);
          } else if (confirmAction?.type === "unsuspend") {
            unsuspendMutation.mutate(confirmAction.user.id);
          }
        }}
        title={confirmAction?.type === "suspend" ? "Suspend User" : "Unsuspend User"}
        description={
          confirmAction?.type === "suspend"
            ? `Are you sure you want to suspend ${confirmAction.user.first_name} ${confirmAction.user.last_name}? They will no longer be able to log in.`
            : `Are you sure you want to restore ${confirmAction?.user.first_name} ${confirmAction?.user.last_name}'s access?`
        }
        confirmText={confirmAction?.type === "suspend" ? "Suspend" : "Unsuspend"}
        isDestructive={confirmAction?.type === "suspend"}
        isLoading={suspendMutation.isPending || unsuspendMutation.isPending}
      />
    </div>
  );
}
