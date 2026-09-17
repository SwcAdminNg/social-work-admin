"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getInstructorApplications } from "@/lib/api/instructor-applications-client";
import type { InstructorApplicationStatus, InstructorApplicationSummary } from "@/lib/api/instructor-applications.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import { IconUserPlus, IconDocument, IconRefresh } from "@/components/dashboard/icons";
import { DataTable, type DataTableColumn } from "@/components/generic/ui/DataTable";
import { Pagination } from "@/components/generic/ui/Pagination";
import { EmptyState } from "@/components/dashboard/EmptyState";

const STATUS_OPTIONS: { value: InstructorApplicationStatus | ""; label: string }[] = [
  { value: "PENDING", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "", label: "All Statuses" },
];

export function StatusBadge({ status }: { status: InstructorApplicationStatus }) {
  const styles: Record<InstructorApplicationStatus, string> = {
    PENDING: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    APPROVED: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  };
  const labels: Record<InstructorApplicationStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function applicantName(app: InstructorApplicationSummary): string {
  const name = [app.first_name, app.last_name].filter(Boolean).join(" ");
  return name || app.email;
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

interface ApplicationQueueListProps {
  initialData: PaginatedResult<InstructorApplicationSummary>;
}

export function ApplicationQueueList({ initialData }: ApplicationQueueListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult<InstructorApplicationSummary>>(initialData);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<InstructorApplicationStatus | "">("PENDING");
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchPage = useCallback(async (page: number, opts?: { status?: InstructorApplicationStatus | "" }) => {
    const effectiveStatus = opts?.status ?? status;
    setLoading(true);
    try {
      const res = await getInstructorApplications({
        status: effectiveStatus || undefined,
        page,
        page_size: dataRef.current.meta.page_size,
      });
      setData(res);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load instructor applications.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  const handleStatusChange = (value: InstructorApplicationStatus | "") => {
    setStatus(value);
    fetchPage(1, { status: value });
  };

  const columns: DataTableColumn<InstructorApplicationSummary>[] = [
    {
      key: "applicant",
      header: "Applicant",
      hideInCard: true,
      render: (a) => (
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[220px]">{applicantName(a)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{a.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (a) => <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{a.phone_number || "—"}</span>,
    },
    {
      key: "cv",
      header: "CV",
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
          <IconDocument />
          {a.cv_file_name}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: "applied",
      header: "Applied",
      render: (a) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap" suppressHydrationWarning>
          {formatRelativeTime(a.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex flex-col gap-1.5 sm:w-56">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</label>
          <select
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as InstructorApplicationStatus | "")}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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

      <div className={`transition-opacity duration-200 ${loading && data.items.length > 0 ? "opacity-60" : ""}`}>
        <DataTable
          columns={columns}
          data={data.items}
          keyExtractor={(a) => a.id}
          loading={loading && data.items.length === 0}
          skeletonRows={5}
          cardTitle={(a) => (
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{applicantName(a)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.email}</p>
            </div>
          )}
          actions={(a) => (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/instructor-applications/${a.id}`)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              Review
            </button>
          )}
          emptyState={
            <EmptyState
              icon={IconUserPlus}
              title="No applications found"
              description="Try a different status filter, or check back later for new applicants."
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
