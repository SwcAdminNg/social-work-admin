"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteResource, listManagedResources } from "@/lib/api/resources-client";
import type { Resource, ManagedResourceListParams, PaginatedResult } from "@/lib/api/resources.types";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { IconLink, IconPlus } from "@/components/dashboard/icons";
import { ResourceCard } from "./ResourceCard";
import { ResourceFilters } from "./ResourceFilters";
import { ConfirmDialog } from "@/components/courses-admin/ConfirmDialog";
import { Pagination } from "@/components/generic/ui/Pagination";

type Tab = "all" | "published" | "draft";

interface ResourceManagementListProps {
  initialData: PaginatedResult<Resource>;
}

export function ResourceManagementList({ initialData }: ResourceManagementListProps) {
  const [result, setResult] = useState(initialData);
  const [tab, setTab] = useState<Tab>("all");
  const [filters, setFilters] = useState<Pick<ManagedResourceListParams, "search" | "category">>({});
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchWith(next: { tab?: Tab; page?: number } = {}) {
    const nextTab = next.tab ?? tab;
    const nextPage = next.page ?? page;

    startTransition(async () => {
      try {
        const data = await listManagedResources({
          ...filters,
          page: nextPage,
          page_size: 12,
          is_published: nextTab === "all" ? undefined : nextTab === "published",
        });
        setResult(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load resources.");
      }
    });
  }

  function handleTabChange(nextTab: Tab) {
    setTab(nextTab);
    setPage(1);
    fetchWith({ tab: nextTab, page: 1 });
  }

  function handleFiltersChange(next: typeof filters) {
    setFilters(next);
    setPage(1);
    startTransition(async () => {
      try {
        const data = await listManagedResources({
          ...next,
          page: 1,
          page_size: 12,
          is_published: tab === "all" ? undefined : tab === "published",
        });
        setResult(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Failed to load resources.");
      }
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      fetchWith();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete resource.");
    } finally {
      setDeleting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All resources" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Drafts" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Resource Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build a library of reference material — policies, templates, recordings, and links.
          </p>
        </div>
        <Link
          href="/dashboard/resource-management/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 no-underline self-start"
        >
          <IconPlus />
          New Resource
        </Link>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              tab === key
                ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ResourceFilters value={filters} onChange={handleFiltersChange} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={IconLink}
          title="No resources found"
          description="Try adjusting your filters, or create a new resource to get started."
        />
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${pending ? "opacity-60" : ""}`}>
          {result.items.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onDelete={() => setDeleteTarget(resource)} />
          ))}
        </div>
      )}

      {result.meta.total_pages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={result.meta.total_pages}
            onPageChange={(p) => {
              setPage(p);
              fetchWith({ page: p });
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this resource?"
        description={`"${deleteTarget?.name}" will be removed from the library.`}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
