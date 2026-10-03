"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { publishResource } from "@/lib/api/resources-client";
import type { Resource } from "@/lib/api/resources.types";
import { IconSpinner } from "@/components/dashboard/icons";

export function PublishControl({
  resource,
  canPublish,
  onPublished,
}: {
  resource: Resource;
  canPublish: boolean;
  onPublished: (fields: Partial<Resource>) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !resource.is_published;
    setLoading(true);
    try {
      const updated = await publishResource(resource.id, next);
      onPublished(updated);
      toast.success(next ? "Resource published." : "Resource unpublished.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update publish status.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || (!resource.is_published && !canPublish);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={!resource.is_published && !canPublish ? "Add at least one attachment before publishing" : undefined}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
        resource.is_published
          ? "text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-ink-line hover:bg-slate-100 dark:hover:bg-slate-800"
          : "text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-green-900/20"
      }`}
    >
      {loading && <IconSpinner className={resource.is_published ? "text-slate-500" : "text-white/80"} />}
      {resource.is_published ? "Unpublish" : "Publish"}
    </button>
  );
}
