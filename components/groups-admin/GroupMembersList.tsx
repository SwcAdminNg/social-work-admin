"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { addGroupMember, removeGroupMember } from "@/lib/api/groups-client";
import { getUsers } from "@/lib/api/users";
import type { Group, GroupMember } from "@/lib/api/groups.types";
import type { User } from "@/lib/api/users.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { IconSearch, IconSpinner, IconTrash, IconUserPlus, IconUsers } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";

function memberName(user: User) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || user.username;
}

export function GroupMembersList({
  group,
  initialMembers,
}: {
  group: Group;
  initialMembers: PaginatedResult<GroupMember>;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<GroupMember[]>(initialMembers.items);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<GroupMember | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      setSearching(true);
      getUsers({ search: trimmed, pageSize: 8 })
        .then((res) => setResults(res.data ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const memberIds = new Set(members.map((m) => m.user_id));

  const handleAdd = (user: User) => {
    setAdding(user.id);
    addGroupMember(group.id, { user_id: user.id })
      .then((member) => {
        setMembers((prev) => [...prev, member]);
        setSearch("");
        setResults([]);
        toast.success(`${memberName(user)} added to ${group.name}.`);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to add member."))
      .finally(() => setAdding(null));
  };

  const handleRemove = () => {
    if (!removing) return;
    setRemoveBusy(true);
    removeGroupMember(group.id, removing.user_id)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.id !== removing.id));
        toast.success(`${memberName(removing.user)} removed from ${group.name}.`);
        setRemoving(null);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to remove member."))
      .finally(() => setRemoveBusy(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/groups")}
          className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
        >
          &larr; Back to Groups
        </button>
      </div>

      <div className="flex flex-col gap-2 p-6 bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-2xl">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{group.name}</h1>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
              group.is_active
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {group.is_active ? "Active" : "Inactive"}
          </span>
        </div>
        {group.description && <p className="text-sm text-slate-500 dark:text-slate-400">{group.description}</p>}
      </div>

      <div className="bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line rounded-2xl p-4 flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Add Member
        </label>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-ink-page/60 border border-slate-200 dark:border-ink-line rounded-lg shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-slate-400 focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 text-slate-900 dark:text-white"
          />
          {searching && <IconSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />}
        </div>
        {results.length > 0 && (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-ink-line border border-slate-100 dark:border-ink-line rounded-lg overflow-hidden">
            {results.map((user) => {
              const already = memberIds.has(user.id);
              return (
                <div key={user.id} className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{memberName(user)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    disabled={already || adding === user.id}
                    onClick={() => handleAdd(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {adding === user.id ? <IconSpinner className="w-3.5 h-3.5" /> : <IconUserPlus />}
                    {already ? "Member" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">Members ({members.length})</h2>
        {members.length === 0 ? (
          <EmptyState icon={IconUsers} title="No members yet" description="Search above to add staff to this group." />
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface overflow-hidden divide-y divide-slate-100 dark:divide-ink-line">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {memberName(member.user)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoving(member)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer flex-shrink-0"
                  aria-label={`Remove ${memberName(member.user)}`}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        description={
          <>
            Remove <strong>{removing ? memberName(removing.user) : ""}</strong> from <strong>{group.name}</strong>?
          </>
        }
        confirmText="Remove"
        isLoading={removeBusy}
        isDestructive
      />
    </div>
  );
}
