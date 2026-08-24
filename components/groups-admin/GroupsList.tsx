"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createGroup, deactivateGroup, getGroups, updateGroup } from "@/lib/api/groups-client";
import type { CreateGroupPayload, Group } from "@/lib/api/groups.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { IconClipboardCheck, IconPlus, IconSpinner } from "@/components/dashboard/icons";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { Pagination } from "@/components/generic/ui/Pagination";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Modal } from "@/components/generic/ui/Modal";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";

export function GroupsList({ initialData }: { initialData: PaginatedResult<Group> }) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<Group>>(initialData);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deactivating, setDeactivating] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchPage = async (page: number) => {
    setLoading(true);
    try {
      const res = await getGroups(page, data.meta.page_size);
      setData(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load groups.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (group: Group) => {
    setBusy(true);
    const run = group.is_active ? deactivateGroup(group.id) : updateGroup(group.id, { is_active: true });
    run
      .then((updated) => {
        setData((prev) => ({ ...prev, items: prev.items.map((g) => (g.id === group.id ? updated : g)) }));
        toast.success(updated.is_active ? "Group activated." : "Group deactivated.");
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to update group."))
      .finally(() => {
        setBusy(false);
        setDeactivating(null);
      });
  };

  const columns: DataTableColumn<Group>[] = [
    {
      key: "name",
      header: "Name",
      hideInCard: true,
      render: (g) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{g.name}</span>
          {g.description && <span className="text-xs text-gray-500 dark:text-gray-400">{g.description}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
            g.is_active
              ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {g.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Groups</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Named staff sets used to target notifications and escalations — e.g. &ldquo;Support Desk&rdquo; receives
            Help &amp; Support escalation emails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors cursor-pointer flex-shrink-0"
        >
          <IconPlus />
          New Group
        </button>
      </div>

      <div className={`transition-opacity duration-200 ${loading && data.items.length > 0 ? "opacity-60" : ""}`}>
        <DataTable
          columns={columns}
          data={data.items}
          keyExtractor={(g) => g.id}
          loading={loading && data.items.length === 0}
          skeletonRows={5}
          cardTitle={(g) => (
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{g.name}</p>
            </div>
          )}
          actions={(g) => (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/groups/${g.id}`)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                Members
              </button>
              <button
                type="button"
                onClick={() => setEditingGroup(g)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => (g.is_active ? setDeactivating(g) : handleToggleActive(g))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  g.is_active
                    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                    : "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20"
                }`}
              >
                {g.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
          emptyState={
            <EmptyState icon={IconClipboardCheck} title="No groups yet" description="Create a group to get started." />
          }
        />
      </div>

      {data.meta.total_pages > 1 && (
        <Pagination currentPage={data.meta.page} totalPages={data.meta.total_pages} onPageChange={fetchPage} />
      )}

      <GroupFormModal
        isOpen={createOpen || !!editingGroup}
        group={editingGroup}
        onClose={() => {
          setCreateOpen(false);
          setEditingGroup(null);
        }}
        onSaved={(group) => {
          setData((prev) => {
            const exists = prev.items.some((g) => g.id === group.id);
            return { ...prev, items: exists ? prev.items.map((g) => (g.id === group.id ? group : g)) : [group, ...prev.items] };
          });
          setCreateOpen(false);
          setEditingGroup(null);
        }}
      />

      <ConfirmModal
        isOpen={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && handleToggleActive(deactivating)}
        title="Deactivate Group"
        description={
          <>
            Deactivate <strong>{deactivating?.name}</strong>? Members stay in the group, but it stops counting as
            active. If this is &ldquo;Support Desk&rdquo;, escalation emails may be affected depending on how your
            backend filters active groups.
          </>
        }
        confirmText="Deactivate"
        isLoading={busy}
        isDestructive
      />
    </div>
  );
}

function GroupFormModal({
  isOpen,
  group,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  group: Group | null;
  onClose: () => void;
  onSaved: (group: Group) => void;
}) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(group?.name ?? "");
    setDescription(group?.description ?? "");
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    const payload: CreateGroupPayload = { name: trimmed, description: description.trim() || undefined };
    const run = group ? updateGroup(group.id, payload) : createGroup(payload);
    run
      .then((saved) => {
        toast.success(group ? "Group updated." : "Group created.");
        onSaved(saved);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to save group."))
      .finally(() => setSaving(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group ? "Edit Group" : "New Group"} maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Support Desk"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <IconSpinner className="w-4 h-4" /> : null}
            {group ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
