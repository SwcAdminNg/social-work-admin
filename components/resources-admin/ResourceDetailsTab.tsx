"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { updateResource } from "@/lib/api/resources-client";
import type { Resource, ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { IconLink, IconSpinner } from "@/components/dashboard/icons";
import { TextField, TextAreaField, SelectField } from "@/components/courses-admin/FormControls";
import { CATEGORY_OPTIONS } from "./constants";
import { VisibilitySelector } from "./VisibilitySelector";
import { ThumbnailUploader } from "./ThumbnailUploader";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ResourceDetailsTab({
  resource,
  onUpdated,
}: {
  resource: Resource;
  onUpdated: (fields: Partial<Resource>) => void;
}) {
  const [name, setName] = useState(resource.name);
  const [description, setDescription] = useState(resource.description ?? "");
  const [category, setCategory] = useState<ResourceCategory>(resource.category);
  const [thumbnailUrl, setThumbnailUrl] = useState(resource.thumbnail_url ?? "");
  const [visibility, setVisibility] = useState<ResourceVisibility>(resource.visibility);
  const [courseId, setCourseId] = useState<string | null>(resource.course_id);
  const [courseTitle, setCourseTitle] = useState<string | null>(resource.course_title ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (visibility === "COURSE_ENROLLED" && !courseId) {
      toast.error("Select a course to tie this resource to.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateResource(resource.id, {
        name,
        description: description || null,
        category,
        visibility,
        course_id: courseId,
      });
      onUpdated(updated);
      toast.success("Resource details saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save resource details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="flex flex-col gap-5 min-w-0">
        <FormSection title="Basics" description="The core information visitors see first.">
          <TextField label="Name" id="name" value={name} onChange={setName} required />
          <TextAreaField
            label="Description"
            id="description"
            value={description}
            onChange={setDescription}
          />
        </FormSection>

        <FormSection title="Thumbnail" description="Shown on the library shelf and this page's header.">
          <ThumbnailUploader
            resourceId={resource.id}
            currentThumbnail={thumbnailUrl}
            onThumbnailUploaded={setThumbnailUrl}
          />
        </FormSection>

        <FormSection title="Classification">
          <SelectField
            label="Category"
            id="category"
            value={category}
            onChange={setCategory}
            options={CATEGORY_OPTIONS}
            required
          />
        </FormSection>

        <FormSection
          title="Visibility"
          description="Controls who can see this resource's attachments. Metadata always stays visible in the public library."
        >
          <VisibilitySelector
            visibility={visibility}
            onVisibilityChange={setVisibility}
            courseId={courseId}
            courseTitle={courseTitle}
            onCourseChange={(id, title) => {
              setCourseId(id);
              setCourseTitle(title);
            }}
          />
        </FormSection>
      </div>

      {/* Sticky summary + save */}
      <div className="lg:sticky lg:top-[88px] flex flex-col gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4">
          <div className="w-full aspect-video rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center text-gray-300 dark:text-gray-600">
            {thumbnailUrl ? (
              <Image src={thumbnailUrl} alt="" width={320} height={180} className="object-cover w-full h-full" />
            ) : (
              <IconLink />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{name || "Untitled resource"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {CATEGORY_OPTIONS.find((o) => o.value === category)?.label}
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && <IconSpinner className="text-white/80" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
