"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { deleteResource, getManagedResource } from "@/lib/api/resources-client";
import type { ResourceManageDetail } from "@/lib/api/resources.types";
import { IconBookOpen, IconGrid, IconLink, IconTrash } from "@/components/dashboard/icons";
import { resourceEditorReducer } from "./resourceEditorReducer";
import { PublishedBadge, VisibilityBadge } from "./StatusBadge";
import { PublishControl } from "./PublishControl";
import { ConfirmDialog } from "@/components/courses-admin/ConfirmDialog";
import { StatTile } from "@/components/courses-admin/StatTile";
import { categoryLabel } from "./constants";
import { ResourceDetailsTab } from "./ResourceDetailsTab";
import { ResourceAttachmentsTab } from "./ResourceAttachmentsTab";

const VIDEO_POLL_INTERVAL_MS = 5000;

type Tab = "details" | "attachments";

export function ResourceEditor({ initialResource }: { initialResource: ResourceManageDetail }) {
  const router = useRouter();
  const [resource, dispatch] = useReducer(resourceEditorReducer, initialResource);
  const [tab, setTab] = useState<Tab>("details");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const resourceRef = useRef(resource);
  useEffect(() => {
    resourceRef.current = resource;
  }, [resource]);

  const hasPendingVideo = resource.attachments.some(
    (a) => a.video && (a.video.status === "PENDING" || a.video.status === "PROCESSING")
  );

  const stats = useMemo(() => {
    const attachments = resource.attachments;
    return {
      attachmentCount: attachments.length,
      videoCount: attachments.filter((a) => a.attachment_type === "VIDEO").length,
      documentCount: attachments.filter((a) => a.attachment_type === "DOCUMENT").length,
      linkCount: attachments.filter((a) => a.attachment_type === "LINKS").length,
    };
  }, [resource.attachments]);

  useEffect(() => {
    if (!hasPendingVideo) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await getManagedResource(resourceRef.current.id);
        dispatch({ type: "SET_RESOURCE", resource: fresh });
      } catch {
        // Silent failure — manual refresh via attachment row remains available.
      }
    }, VIDEO_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPendingVideo]);

  async function refreshResource() {
    try {
      const fresh = await getManagedResource(resource.id);
      dispatch({ type: "SET_RESOURCE", resource: fresh });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to refresh resource.");
    }
  }

  async function handleDeleteResource() {
    setDeleting(true);
    try {
      await deleteResource(resource.id);
      toast.success("Resource deleted.");
      router.push("/dashboard/resource-management");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete resource.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/resource-management"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] no-underline transition-colors duration-150"
        >
          ← Back to Resource Management
        </Link>
      </div>

      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#2D6A4F] to-[#1e4d38] text-white shadow-lg shadow-green-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center text-white/70">
            {resource.thumbnail_url ? (
              <Image
                src={resource.thumbnail_url}
                alt=""
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <IconLink />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
              {categoryLabel(resource.category)}
              {resource.course_title ? ` · Tied to "${resource.course_title}"` : ""}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{resource.name}</h1>
              <PublishedBadge isPublished={resource.is_published} tone="banner" />
            </div>
            <div className="mt-2">
              <VisibilityBadge visibility={resource.visibility} />
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={IconGrid} label="Attachments" value={stats.attachmentCount} />
        <StatTile icon={IconBookOpen} label="Videos" value={stats.videoCount} />
        <StatTile icon={IconBookOpen} label="Documents" value={stats.documentCount} />
        <StatTile icon={IconLink} label="Links" value={stats.linkCount} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 self-start overflow-x-auto">
          {(
            [
              { key: "details", label: "Details", count: undefined },
              { key: "attachments", label: "Attachments", count: stats.attachmentCount },
            ] as const satisfies readonly { key: Tab; label: string; count: number | undefined }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                tab === key
                  ? "bg-white dark:bg-gray-800 text-[#2D6A4F] dark:text-[#52b788] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {label}
              {typeof count === "number" && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[0.65rem] font-bold ${
                    tab === key
                      ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <PublishControl
            resource={resource}
            canPublish={resource.attachments.length > 0}
            onPublished={(fields) => dispatch({ type: "UPDATE_RESOURCE_FIELDS", fields })}
          />
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
            aria-label="Delete resource"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {tab === "details" && (
        <ResourceDetailsTab
          resource={resource}
          onUpdated={(fields) => dispatch({ type: "UPDATE_RESOURCE_FIELDS", fields })}
        />
      )}
      {tab === "attachments" && (
        <ResourceAttachmentsTab resource={resource} dispatch={dispatch} onRefresh={refreshResource} />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this resource?"
        description={`"${resource.name}" and its attachments will be removed from the library.`}
        loading={deleting}
        onConfirm={handleDeleteResource}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
