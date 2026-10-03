"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { deleteResource, listManagedResources } from "@/lib/api/resources-client";
import type { Resource } from "@/lib/api/resources.types";
import { ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { ResourceCard, ResourceCardSkeleton } from "@/components/studio/resources/ResourceCard";
import { resourceKeys } from "@/components/studio/resources/ResourceEditorContext";
import { RESOURCE_ICON } from "@/components/studio/resources/resourceMeta";

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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await deleteResource(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" was deleted`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: resourceKeys.all }),
      ]);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete resource.");
      throw error;
    }
  }

  const newResourceHref = `/dashboard/resource-management/new?course_id=${encodeURIComponent(courseId)}&course_title=${encodeURIComponent(courseTitle)}`;

  return (
    <Card>
      <CardHeader
        title="Course resources"
        description="Reference material tied to this course — policies, templates, recordings and links. It lives in the resource library, separate from the curriculum."
        actions={
          <ButtonLink href={newResourceHref} icon={Plus}>
            New resource
          </ButtonLink>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ResourceCardSkeleton key={i} view="grid" />
          ))}
        </div>
      ) : !resources?.length ? (
        <EmptyState
          icon={RESOURCE_ICON}
          compact
          title="No resources tied to this course yet"
          description="Add a client-intake template, recommended reading or a session recording — without burying it in the curriculum."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this resource?"
        description={`“${deleteTarget?.name}” and its attachments will be removed from the library. This can't be undone.`}
        confirmLabel="Delete resource"
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
}
