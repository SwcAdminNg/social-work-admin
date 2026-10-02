"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { grantStaffRole, listStaffRoles, revokeStaffRole } from "@/lib/api/governance-client";
import type { GovernanceRole, StaffRoleAssignment } from "@/lib/api/governance.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { Badge, DashboardCard, formatDate, humanize, roleOptions } from "./GovernanceUtils";
import { CourseSearchSelect, UserSearchSelect, type SelectedCourse, type SelectedUser } from "./SearchSelects";

export function StaffRolesManager() {
  const [items, setItems] = useState<StaffRoleAssignment[]>([]);
  const [loading, startTransition] = useTransition();
  const [filterUser, setFilterUser] = useState<SelectedUser | null>(null);
  const [filterCourse, setFilterCourse] = useState<SelectedCourse | null>(null);
  const [roleFilter, setRoleFilter] = useState<GovernanceRole | "">("");
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(null);
  const [form, setForm] = useState({ role: "ACADEMIC_REVIEWER" as GovernanceRole, reason: "", expires_at: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    startTransition(async () => {
      try {
        const result = await listStaffRoles({
          user_id: filterUser?.id,
          course_id: filterCourse?.id,
          role: roleFilter,
          include_revoked: includeRevoked,
        });
        setItems(result.items);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load staff roles.");
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial list load
  }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Select a user first.");
      return;
    }
    setSaving(true);
    try {
      await grantStaffRole({
        user_id: selectedUser.id,
        role: form.role,
        course_id: selectedCourse?.id ?? null,
        reason: form.reason.trim() || null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      });
      toast.success("Staff role granted.");
      setSelectedUser(null);
      setSelectedCourse(null);
      setForm((prev) => ({ ...prev, reason: "", expires_at: "" }));
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to grant role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(item: StaffRoleAssignment) {
    const assignmentId = item.assignment_id ?? item.id;
    const reason = window.prompt("Reason for revoking this role?") ?? undefined;
    try {
      await revokeStaffRole(assignmentId, reason);
      toast.success("Staff role revoked.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to revoke role.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Staff Roles</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Grant scoped reviewer, moderation, course lead, and publishing roles.
        </p>
      </div>

      <DashboardCard className="p-5">
        <form onSubmit={handleGrant} className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
          <Field label="User">
            <UserSearchSelect value={selectedUser} onChange={setSelectedUser} placeholder="Search staff by name or email" />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as GovernanceRole })} className="input">
              {roleOptions.map((role) => (
                <option key={role} value={role}>{humanize(role)}</option>
              ))}
            </select>
          </Field>
          <Field label="Course scope">
            <CourseSearchSelect value={selectedCourse} onChange={setSelectedCourse} placeholder="Search course, or leave platform-wide" />
          </Field>
          <Field label="Expires (optional)">
            <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input" />
          </Field>
          <button disabled={saving || !selectedUser} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-4 text-sm font-bold text-white disabled:opacity-60">
            {saving && <IconSpinner />}
            Grant role
          </button>
          <div className="lg:col-span-5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} className="input mt-1 resize-none" />
          </div>
        </form>
      </DashboardCard>

      <DashboardCard>
        <div className="flex flex-col gap-3 border-b border-gray-200 dark:border-gray-800 p-4 lg:flex-row lg:items-end">
          <Field label="Filter by user">
            <UserSearchSelect value={filterUser} onChange={setFilterUser} placeholder="Search user" />
          </Field>
          <Field label="Filter by course">
            <CourseSearchSelect value={filterCourse} onChange={setFilterCourse} placeholder="Search course" />
          </Field>
          <Field label="Filter by role">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as GovernanceRole | "")} className="input">
              <option value="">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{humanize(role)}</option>
              ))}
            </select>
          </Field>
          <label className="flex h-10 items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={includeRevoked} onChange={(e) => setIncludeRevoked(e.target.checked)} className="accent-[#2D6A4F]" />
            Include revoked
          </label>
          <button type="button" onClick={load} className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-bold dark:border-gray-800">
            Apply
          </button>
        </div>
        <div className={loading ? "opacity-60" : ""}>
          {items.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No staff role grants found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-950 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr key={item.assignment_id ?? item.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.user?.name ?? item.user_id}</div>
                        {item.user?.email && <div className="text-xs text-gray-500">{item.user.email}</div>}
                      </td>
                      <td className="px-4 py-3"><Badge tone="blue">{humanize(item.role)}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.course?.title ?? item.course_id ?? "Platform-wide"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(item.expires_at)}</td>
                      <td className="px-4 py-3">{item.revoked_at ? <Badge tone="red">Revoked</Badge> : <Badge tone="green">Active</Badge>}</td>
                      <td className="px-4 py-3 text-right">
                        {!item.revoked_at && (
                          <button type="button" onClick={() => handleRevoke(item)} className="text-sm font-bold text-red-600 hover:underline">
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
      {label}
      {children}
    </label>
  );
}
