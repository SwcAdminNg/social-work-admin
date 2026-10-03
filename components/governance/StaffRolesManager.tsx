"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { listStaffMembers, revokeStaffRole } from "@/lib/api/governance-client";
import type { GovernanceRole, StaffMemberRoles, StaffRoleAssignment, StaffRoleStatus } from "@/lib/api/governance.types";
import { Modal } from "@/components/generic/ui/Modal";
import { Pagination } from "@/components/generic/ui/Pagination";
import { IconPlus, IconSearch, IconSpinner, IconUsers, IconX } from "@/components/dashboard/icons";
import {
  Avatar,
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
import { Select } from "@/components/ui/select";

const PAGE_SIZE = 20;
const EXPIRING_SOON_DAYS = 14;
const SEARCH_DEBOUNCE_MS = 300;

const chipTone = {
  Authoring: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  Review: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
  Approval: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
} as const;

export function StaffRolesManager() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StaffRoleStatus>("ACTIVE");
  const [role, setRole] = useState<GovernanceRole | "">("");
  const [course, setCourse] = useState<SelectedCourse | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<GrantPreset | undefined>();
  const [revoking, setRevoking] = useState<StaffRoleAssignment | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const params = {
    search: debouncedSearch || undefined,
    role,
    course_id: course?.id,
    status,
    page,
    page_size: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["staff-roles", "members", params],
    queryFn: () => listStaffMembers(params),
    placeholderData: keepPreviousData,
  });

  const members = data?.items ?? [];
  const total = data?.meta.total_items ?? 0;
  const hasFilters = !!(role || course || search);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setRole("");
    setCourse(null);
    setSearch("");
    setDebouncedSearch("");
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
          <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Staff Roles</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Who can author, review, approve and publish — platform-wide or per course.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openGrant()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 sm:self-auto"
        >
          <IconPlus />
          Grant role
        </button>
      </div>

      <DashboardCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-ink-line">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative lg:w-64 lg:shrink-0">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, username…"
                className="input input-with-icon"
                aria-label="Search staff"
              />
            </div>
            <div className="lg:w-52 lg:shrink-0">
              <Select
                value={role}
                onChange={(value) => resetPage(setRole)(value as GovernanceRole | "")}
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{humanize(r)}</option>
                ))}
              </Select>
            </div>
            <div className="lg:w-64 lg:shrink-0">
              <CourseSearchSelect value={course} onChange={resetPage(setCourse)} placeholder="Any course" />
            </div>
            <div className="lg:ml-auto">
              <Segmented
                value={status}
                onChange={resetPage(setStatus)}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "REVOKED", label: "Revoked" },
                  { value: "ALL", label: "All" },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {data && (
              <span>
                {total} {total === 1 ? "person" : "people"}
              </span>
            )}
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-semibold hover:text-slate-800 dark:hover:text-slate-200">
                Clear filters
              </button>
            )}
            {isFetching && !isLoading && <IconSpinner className="text-slate-400" />}
          </div>
        </div>

        {isLoading ? (
          <SkeletonRows />
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-400">
              <IconUsers />
            </div>
            <p className="font-bold text-slate-900 dark:text-white">{hasFilters ? "No matches" : "No staff roles yet"}</p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {hasFilters ? "Try a different search or clear the filters." : "Grant your first reviewer or approver to start the approval workflow."}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                Clear filters
              </button>
            ) : (
              <button type="button" onClick={() => openGrant()} className="mt-1 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white">
                <IconPlus /> Grant role
              </button>
            )}
          </div>
        ) : (
          <ul className={`divide-y divide-slate-100 transition-opacity dark:divide-ink-line ${isFetching ? "opacity-70" : ""}`}>
            {members.map((member) => (
              <MemberRow
                key={member.user.id}
                member={member}
                onGrant={(courseRef) =>
                  openGrant({
                    user: { id: member.user.id, name: member.user.name, email: member.user.email, userType: member.user.user_type },
                    course: courseRef ?? null,
                  })
                }
                onRevoke={(grant) => setRevoking({ ...grant, user: grant.user ?? { id: member.user.id, name: member.user.name } })}
              />
            ))}
          </ul>
        )}

        {data && data.meta.total_pages > 1 && (
          <div className="border-t border-slate-200 dark:border-ink-line">
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

type ScopeGroup = { key: string; course: { id: string; title: string } | null; grants: StaffRoleAssignment[] };

/** Platform-wide grants first, then one group per course (the API already orders them). */
function groupByScope(grants: StaffRoleAssignment[]): ScopeGroup[] {
  const groups = new Map<string, ScopeGroup>();
  for (const grant of grants) {
    const key = grant.course_id ?? "platform";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        course: grant.course_id ? { id: grant.course_id, title: grant.course?.title ?? "Unknown course" } : null,
        grants: [],
      };
      groups.set(key, group);
    }
    group.grants.push(grant);
  }
  return [...groups.values()];
}

function MemberRow({
  member,
  onGrant,
  onRevoke,
}: {
  member: StaffMemberRoles;
  onGrant: (course?: { id: string; title: string } | null) => void;
  onRevoke: (grant: StaffRoleAssignment) => void;
}) {
  const { user } = member;
  const scopes = groupByScope(member.roles);
  const summary = [
    `${member.active_role_count} active role${member.active_role_count === 1 ? "" : "s"}`,
    member.course_count ? `${member.course_count} course${member.course_count === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="grid grid-cols-1 gap-x-6 gap-y-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:items-start">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={user.name} src={user.profile_picture_url} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={user.email}>{user.email}</p>
          <p className="mt-0.5 text-[0.7rem] text-slate-400 dark:text-slate-500">{summary}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        {scopes.map((scope) => (
          <div key={scope.key} className="group/scope flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
            <span
              className={`shrink-0 pt-1 text-xs font-semibold sm:w-44 sm:truncate ${scope.course ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}
              title={scope.course?.title}
            >
              {scope.course ? scope.course.title : "Platform-wide"}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {scope.grants.map((grant) => (
                <RoleChip key={grant.assignment_id ?? grant.id} grant={grant} onRevoke={() => onRevoke(grant)} />
              ))}
              <button
                type="button"
                onClick={() => onGrant(scope.course)}
                className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 transition-opacity hover:bg-slate-100 hover:text-brand-600 focus:opacity-100 md:opacity-0 md:group-hover/scope:opacity-100 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                aria-label={`Add a role for ${user.name} ${scope.course ? `on ${scope.course.title}` : "platform-wide"}`}
              >
                + Role
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="md:pt-0.5">
        <button
          type="button"
          onClick={() => onGrant()}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-400"
        >
          <IconPlus /> Add role
        </button>
      </div>
    </li>
  );
}

function RoleChip({ grant, onRevoke }: { grant: StaffRoleAssignment; onRevoke: () => void }) {
  const details = roleDetails[grant.role as keyof typeof roleDetails];
  const group = details?.group ?? "Authoring";
  const days = daysUntil(grant.expires_at);
  const revoked = !!grant.revoked_at;
  const expired = !revoked && days !== null && days < 0;
  const expiringSoon = !revoked && days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
  const revokeReason = grant.revoke_reason ?? grant.revoked_reason;

  const note = revoked
    ? `Revoked ${formatDate(grant.revoked_at)}${revokeReason ? ` — ${revokeReason}` : ""}`
    : expired
      ? `Expired ${formatDate(grant.expires_at)}`
      : grant.expires_at
        ? `Expires ${formatDate(grant.expires_at)}`
        : "No expiry";
  const grantedBy = grant.granted_by_user?.name ? ` · Granted by ${grant.granted_by_user.name}` : "";

  return (
    <span
      title={`${details?.description ?? ""}\n${note}${grantedBy}`}
      className={`inline-flex items-center gap-1 rounded-full py-1 pl-2.5 text-xs font-bold ring-1 ring-inset ${chipTone[group]} ${
        revoked || expired ? "pr-2.5 line-through opacity-50" : "pr-1"
      }`}
    >
      {humanize(grant.role)}
      {expiringSoon && <span className="font-semibold text-amber-600 dark:text-amber-400">· {relativeTime(grant.expires_at)}</span>}
      {!revoked && !expired && (
        <button
          type="button"
          onClick={onRevoke}
          className="ml-0.5 rounded-full p-0.5 opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
          aria-label={`Revoke ${humanize(grant.role)}`}
        >
          <IconX size={12} />
        </button>
      )}
    </span>
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white">{item.user?.name ?? "This person"}</strong> will immediately lose{" "}
            <strong className="text-slate-900 dark:text-white">{humanize(item.role)}</strong>{" "}
            {item.course?.title ? <>on {item.course.title}</> : "platform-wide"}.
          </p>
          <div>
            <label htmlFor="revoke-reason" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Reason <span className="font-normal text-slate-400">(optional)</span>
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
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
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
