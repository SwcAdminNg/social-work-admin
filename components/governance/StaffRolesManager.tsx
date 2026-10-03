"use client";

import { useMemo, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listStaffRoles, revokeStaffRole } from "@/lib/api/governance-client";
import type { GovernanceRole, StaffRoleAssignment } from "@/lib/api/governance.types";
import { Modal } from "@/components/generic/ui/Modal";
import { Pagination } from "@/components/generic/ui/Pagination";
import { IconPlus, IconSearch, IconSpinner, IconUsers, IconX } from "@/components/dashboard/icons";
import {
  Avatar,
  Badge,
  daysUntil,
  DashboardCard,
  formatDate,
  humanize,
  relativeTime,
  roleDetails,
  roleOptions,
  Segmented,
  SkeletonRows,
} from "./GovernanceUtils";
import { GrantRoleDrawer, type GrantPreset } from "./GrantRoleDrawer";
import { CourseSearchSelect, type SelectedCourse } from "./SearchSelects";

const PAGE_SIZE = 25;
const EXPIRING_SOON_DAYS = 14;

type StatusFilter = "active" | "revoked" | "all";

const groupTone = { Authoring: "gray", Review: "blue", Approval: "green" } as const;

export function StaffRolesManager() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [role, setRole] = useState<GovernanceRole | "">("");
  const [course, setCourse] = useState<SelectedCourse | null>(null);
  const [person, setPerson] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<GrantPreset | undefined>();
  const [revoking, setRevoking] = useState<StaffRoleAssignment | null>(null);

  const params = {
    role,
    course_id: course?.id,
    user_id: person?.id,
    include_revoked: status !== "active",
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["staff-roles", "list", params],
    queryFn: () => listStaffRoles(params),
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => {
    let rows = data?.items ?? [];
    if (status === "revoked") rows = rows.filter((item) => item.revoked_at);
    const term = search.trim().toLowerCase();
    if (term) {
      rows = rows.filter((item) =>
        [item.user?.name, item.user?.email, item.course?.title, humanize(item.role)]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term)),
      );
    }
    return rows;
  }, [data, status, search]);

  const hasFilters = !!(role || course || person || search);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setRole("");
    setCourse(null);
    setPerson(null);
    setSearch("");
    setPage(1);
  }

  function openGrant(next?: GrantPreset) {
    setPreset(next);
    setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Staff Roles</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Who can author, review, approve and publish — platform-wide or per course.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openGrant()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1e4d38] sm:self-auto"
        >
          <IconPlus />
          Grant role
        </button>
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:w-64 lg:shrink-0">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, course…"
                className="input input-with-icon"
                aria-label="Search staff roles"
              />
            </div>
            <div className="lg:w-52 lg:shrink-0">
              <select
                value={role}
                onChange={(e) => resetPage(setRole)(e.target.value as GovernanceRole | "")}
                className="input"
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{humanize(r)}</option>
                ))}
              </select>
            </div>
            <div className="lg:w-64 lg:shrink-0">
              <CourseSearchSelect value={course} onChange={resetPage(setCourse)} placeholder="Any course" />
            </div>
            <div className="lg:ml-auto">
              <Segmented
                value={status}
                onChange={resetPage(setStatus)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "revoked", label: "Revoked" },
                  { value: "all", label: "All" },
                ]}
              />
            </div>
          </div>

          {(person || hasFilters) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {person && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2D6A4F]/10 py-1 pl-3 pr-1.5 font-semibold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
                  {person.name}
                  <button type="button" onClick={() => resetPage(setPerson)(null)} aria-label="Clear person filter" className="rounded-full p-0.5 hover:bg-black/5">
                    <IconX size={14} />
                  </button>
                </span>
              )}
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Clear filters
                </button>
              )}
              {isFetching && !isLoading && <IconSpinner className="text-gray-400" />}
            </div>
          )}
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
              <IconUsers />
            </div>
            <p className="font-bold text-gray-900 dark:text-white">{hasFilters ? "No matches" : "No staff roles yet"}</p>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {hasFilters ? "Try a different search or clear the filters." : "Grant your first reviewer or approver to start the approval workflow."}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="mt-1 text-sm font-bold text-[#2D6A4F] dark:text-[#52b788]">
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={() => openGrant()} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-4 py-2 text-sm font-bold text-white">
                <IconPlus /> Grant role
              </button>
            )}
          </div>
        ) : (
          <ul className={`divide-y divide-gray-100 transition-opacity dark:divide-gray-800 ${isFetching ? "opacity-70" : ""}`}>
            {items.map((item) => (
              <RoleRow
                key={item.assignment_id ?? item.id}
                item={item}
                onFilterPerson={() => {
                  setPerson({ id: item.user_id, name: item.user?.name ?? "This person" });
                  setPage(1);
                }}
                onGrantAnother={() =>
                  openGrant({ user: { id: item.user_id, name: item.user?.name ?? item.user_id, email: item.user?.email } })
                }
                onRevoke={() => setRevoking(item)}
              />
            ))}
          </ul>
        )}

        {data && data.meta.total_pages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-800">
            <Pagination currentPage={page} totalPages={data.meta.total_pages} onPageChange={setPage} />
          </div>
        )}
      </DashboardCard>

      <GrantRoleDrawer open={drawerOpen} onOpenChange={setDrawerOpen} preset={preset} />

      <RevokeModal
        item={revoking}
        onClose={() => setRevoking(null)}
        onDone={() => {
          setRevoking(null);
          queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
        }}
      />
    </div>
  );
}

function RoleRow({
  item,
  onFilterPerson,
  onGrantAnother,
  onRevoke,
}: {
  item: StaffRoleAssignment;
  onFilterPerson: () => void;
  onGrantAnother: () => void;
  onRevoke: () => void;
}) {
  const name = item.user?.name ?? item.user_id;
  const days = daysUntil(item.expires_at);
  const expired = !item.revoked_at && days !== null && days < 0;
  const expiringSoon = !item.revoked_at && days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
  const inactive = !!item.revoked_at || expired;
  const group = roleDetails[item.role as keyof typeof roleDetails]?.group ?? "Authoring";

  return (
    <li className={`group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors hover:bg-gray-50/70 sm:px-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] dark:hover:bg-gray-800/30 ${inactive ? "opacity-60" : ""}`}>
      <button type="button" onClick={onFilterPerson} className="flex min-w-0 items-center gap-3 text-left" title="Show all roles for this person">
        <Avatar name={name} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-900 group-hover:underline decoration-gray-300 underline-offset-2 dark:text-white">{name}</span>
          {item.user?.email && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{item.user.email}</span>}
        </span>
      </button>

      <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-2 md:col-span-1 md:row-start-auto">
        <Badge tone={groupTone[group]}>{humanize(item.role)}</Badge>
        <span className="text-xs text-gray-500 md:hidden dark:text-gray-400">
          {item.course?.title ?? (item.course_id ? "Course" : "Platform-wide")}
        </span>
      </div>

      <div className="hidden min-w-0 text-sm md:block">
        {item.course?.title || item.course_id ? (
          <span className="block truncate text-gray-700 dark:text-gray-300" title={item.course?.title ?? undefined}>
            {item.course?.title ?? item.course_id}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Platform-wide</span>
        )}
      </div>

      <div className="hidden text-sm md:block" title={item.expires_at ? formatDate(item.expires_at) : undefined}>
        {item.revoked_at ? (
          <Badge tone="red">Revoked</Badge>
        ) : expired ? (
          <Badge tone="gray">Expired</Badge>
        ) : expiringSoon ? (
          <Badge tone="amber">Expires {relativeTime(item.expires_at)}</Badge>
        ) : item.expires_at ? (
          <span className="text-gray-600 dark:text-gray-300">Until {new Date(item.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">No expiry</span>
        )}
      </div>

      <div className="row-start-1 col-start-2 md:row-start-auto md:col-start-auto">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label={`Actions for ${name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="12" cy="19" r="1.75" />
              </svg>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl data-[state=open]:animate-[popIn_120ms_ease-out] dark:border-gray-800 dark:bg-gray-900"
            >
              <MenuItem onSelect={onGrantAnother}>Grant another role</MenuItem>
              <MenuItem onSelect={onFilterPerson}>View all their roles</MenuItem>
              {!item.revoked_at && (
                <>
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
                  <MenuItem onSelect={onRevoke} danger>Revoke access</MenuItem>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </li>
  );
}

function MenuItem({ onSelect, danger, children }: { onSelect: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`cursor-pointer px-4 py-2.5 text-sm font-medium outline-none data-[highlighted]:bg-gray-50 dark:data-[highlighted]:bg-gray-800 ${
        danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
      }`}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function RevokeModal({ item, onClose, onDone }: { item: StaffRoleAssignment | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const revoke = useMutation({
    mutationFn: () => revokeStaffRole(item!.assignment_id ?? item!.id, reason),
    onSuccess: () => {
      toast.success(`${humanize(item?.role)} revoked.`);
      setReason("");
      onDone();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to revoke role."),
  });

  return (
    <Modal isOpen={!!item} onClose={onClose} title="Revoke access?" maxWidth="md">
      {item && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            revoke.mutate();
          }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong className="text-gray-900 dark:text-white">{item.user?.name ?? item.user_id}</strong> will immediately lose{" "}
            <strong className="text-gray-900 dark:text-white">{humanize(item.role)}</strong>{" "}
            {item.course?.title ? <>on {item.course.title}</> : "platform-wide"}.
          </p>
          <div>
            <label htmlFor="revoke-reason" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="revoke-reason"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Moved to another team"
              className="input mt-1.5"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={revoke.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              {revoke.isPending && <IconSpinner />}
              Revoke
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
