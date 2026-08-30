"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteResource, listManagedResources } from "@/lib/api/resources-client";
import type { Resource } from "@/lib/api/resources.types";
import { IconLink, IconPlus, IconSpinner } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ResourceCard } from "@/components/resources-admin/ResourceCard";
import { ConfirmDialog } from "./ConfirmDialog";

export function CourseResourcesTab({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["course_resources", courseId];
  const { data: resources, isLoading } = useQuery({
    queryKey,
    queryFn: async () => (await listManagedResources({ course_id: courseId, page_size: 50 })).items,
  });
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" was deleted.`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete resource.");
    } finally {
      setDeleting(false);
    }
  }

  const newResourceHref = `/dashboard/resource-management/new?course_id=${encodeURIComponent(
    courseId
  )}&course_title=${encodeURIComponent(courseTitle)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Reference material tied to this course — policies, templates, recordings, and links. Lives
          in the general Resources library, separate from the curriculum above.
        </p>
        <Link
          href={newResourceHref}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 no-underline self-start flex-shrink-0"
        >
          <IconPlus />
          New Resource
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <IconSpinner />
        </div>
      ) : resources && resources.length === 0 ? (
        <EmptyState
          icon={IconLink}
          title="No resources tied to this course yet"
          description="Add a client-intake template, recommended reading, or a session recording — without burying it in the curriculum."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources?.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onDelete={() => setDeleteTarget(resource)} />
          ))}
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
