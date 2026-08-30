"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { updateAttachment } from "@/lib/api/resources-client";
import type { ResourceAttachment, ResourceLink } from "@/lib/api/resources.types";

export function LinkEditor({
  attachment,
  onLinkUpdate,
}: {
  attachment: ResourceAttachment;
  onLinkUpdate: (link: ResourceLink) => void;
}) {
  const link = attachment.link;
  const [url, setUrl] = useState(link?.url ?? "");
  const [label, setLabel] = useState(link?.label ?? "");
  const [description, setDescription] = useState(link?.description ?? "");

  async function save(fields: Partial<Pick<ResourceLink, "url" | "label" | "description">>) {
    const next: ResourceLink = {
      url: fields.url !== undefined ? fields.url : url,
      label: fields.label !== undefined ? fields.label : label || null,
      description: fields.description !== undefined ? fields.description : description || null,
    };
    if (
      next.url === (link?.url ?? "") &&
      (next.label ?? "") === (link?.label ?? "") &&
      (next.description ?? "") === (link?.description ?? "")
    ) {
      return;
    }
    try {
      await updateAttachment(attachment.id, {
        url: next.url,
        label: next.label,
        description: next.description,
      });
      onLinkUpdate(next);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update link.");
      setUrl(link?.url ?? "");
      setLabel(link?.label ?? "");
      setDescription(link?.description ?? "");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => save({ url })}
          placeholder="https://example.org/article"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
          Display label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => save({ label: label || null })}
          placeholder="Falls back to the attachment title if left blank"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => save({ description: description || null })}
          rows={2}
          placeholder="A short blurb about this resource."
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
        />
      </div>
    </div>
  );
}
