"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getTickets } from "@/lib/api/support-client";
import { getUsers } from "@/lib/api/users";
import type { Ticket, TicketStatus } from "@/lib/api/support.types";
import type { User } from "@/lib/api/users.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { IconLifeBuoy, IconAlertTriangle, IconStar, IconRefresh } from "@/components/dashboard/icons";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { Pagination } from "@/components/generic/ui/Pagination";
import { EmptyState } from "@/components/dashboard/EmptyState";

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const AUTO_REFRESH_MS = 20_000;

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    IN_PROGRESS: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    RESOLVED: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  const labels: Record<TicketStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ticketDisplayName(ticket: Ticket): string {
  if (ticket.subject) return ticket.subject;
  const name = [ticket.user?.first_name, ticket.user?.last_name].filter(Boolean).join(" ");
  return name || ticket.user?.username || `Ticket #${ticket.id.slice(0, 8)}`;
}

function adminDisplayName(admin?: { first_name?: string; last_name?: string; username?: string } | null): string {
  if (!admin) return "";
  const name = [admin.first_name, admin.last_name].filter(Boolean).join(" ");
  return name || admin.username || "";
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

interface TicketQueueListProps {
  initialData: PaginatedResult<Ticket>;
  currentAdminId: string;
}

export function TicketQueueList({ initialData, currentAdminId }: TicketQueueListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<Ticket>>(initialData);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");
  const [admins, setAdmins] = useState<User[]>([]);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    getUsers({ userType: "ADMIN", pageSize: 100 })
      .then((res) => setAdmins(res.data ?? []))
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(
    async (page: number, opts?: { status?: TicketStatus | ""; assignedAdminId?: string; silent?: boolean }) => {
      const effectiveStatus = opts?.status ?? status;
      const effectiveAssigned = opts?.assignedAdminId ?? assignedFilter;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await getTickets({
          status: effectiveStatus || undefined,
          assigned_admin_id: effectiveAssigned === "me" ? currentAdminId : effectiveAssigned || undefined,
          page,
          page_size: dataRef.current.meta.page_size,
        });
        setData(res);
      } catch (err) {
        if (!opts?.silent) {
          toast.error(err instanceof ApiError ? err.message : "Failed to load tickets.");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [status, assignedFilter, currentAdminId]
  );

  // Silent background auto-refresh so the queue stays live for whoever is watching it.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPage(dataRef.current.meta.page, { silent: true });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchPage]);

  const handleStatusChange = (value: TicketStatus | "") => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const handleAssignedChange = (value: string) => {
    setAssignedFilter(value);
    fetchPage(1, { assignedAdminId: value });
  };

  const columns: DataTableColumn<Ticket>[] = [
    {
      key: "ticket",
      header: "Ticket",
      hideInCard: true,
      render: (t) => (
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">
            {ticketDisplayName(t)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
            {t.user?.email ?? t.user_id}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={t.status} />
          {t.escalated_at && (t.status === "OPEN" || t.status === "IN_PROGRESS") && (
            <span
              title={`Escalated ${formatRelativeTime(t.escalated_at)}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
            >
              <IconAlertTriangle className="w-3 h-3" />
              Escalated
            </span>
          )}
        </div>
      ),
    },
    {
      key: "assigned",
      header: "Assigned To",
      render: (t) =>
        t.assigned_admin ? (
          <span className="text-sm">{adminDisplayName(t.assigned_admin)}</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        ),
    },
    {
      key: "activity",
      header: "Last Activity",
      render: (t) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap" suppressHydrationWarning>
          {formatRelativeTime(t.last_admin_reply_at ?? t.last_user_message_at ?? t.created_at)}
        </span>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (t) =>
        t.rating ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <IconStar />
            {t.rating}/5
          </span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</label>
            <select
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus | "")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Assigned To</label>
            <select
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              value={assignedFilter}
              onChange={(e) => handleAssignedChange(e.target.value)}
            >
              <option value="">Everyone</option>
              <option value="me">Assigned to me</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {[admin.first_name, admin.last_name].filter(Boolean).join(" ") || admin.username}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => fetchPage(data.meta.page)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <IconRefresh className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className={`transition-opacity duration-200 ${loading && data.items.length > 0 ? "opacity-60" : ""}`}>
        <DataTable
          columns={columns}
          data={data.items}
          keyExtractor={(t) => t.id}
          loading={loading && data.items.length === 0}
          skeletonRows={5}
          cardTitle={(t) => (
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ticketDisplayName(t)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.user?.email ?? t.user_id}</p>
            </div>
          )}
          actions={(t) => (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/help-support/tickets/${t.id}`)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              Open
            </button>
          )}
          emptyState={
            <EmptyState
              icon={IconLifeBuoy}
              title="No tickets found"
              description="Try adjusting your filters, or check back later."
            />
          }
        />
      </div>

      {data.meta.total_pages > 1 && (
        <Pagination currentPage={data.meta.page} totalPages={data.meta.total_pages} onPageChange={(p) => fetchPage(p)} />
      )}
    </div>
  );
}
