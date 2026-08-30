"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createResource } from "@/lib/api/resources-client";
import type { ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { TextField, TextAreaField, SelectField } from "@/components/courses-admin/FormControls";
import { CATEGORY_OPTIONS } from "./constants";
import { VisibilitySelector } from "./VisibilitySelector";

export function CreateResourceForm({
  presetCourseId,
  presetCourseTitle,
}: {
  presetCourseId?: string;
  presetCourseTitle?: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("PRACTICE_RESOURCES");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ResourceVisibility>(
    presetCourseId ? "COURSE_ENROLLED" : "PUBLIC"
  );
  const [courseId, setCourseId] = useState<string | null>(presetCourseId ?? null);
  const [courseTitle, setCourseTitle] = useState<string | null>(presetCourseTitle ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (visibility === "COURSE_ENROLLED" && !courseId) {
      toast.error("Select a course to tie this resource to.");
      return;
    }

    setSubmitting(true);
    try {
      const resource = await createResource({
        name,
        category,
        description: description || null,
        visibility,
        course_id: courseId,
      });
      toast.success("Resource created as a draft.");
      router.push(`/dashboard/resource-management/${resource.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create resource.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
    >
      <TextField
        label="Name"
        id="name"
        value={name}
        onChange={setName}
        required
        placeholder="e.g. Safeguarding Policy"
      />
      <TextAreaField
        label="Description"
        id="description"
        value={description}
        onChange={setDescription}
        placeholder="What is this resource, and who is it for?"
      />
      <SelectField
        label="Category"
        id="category"
        value={category}
        onChange={setCategory}
        options={CATEGORY_OPTIONS}
        required
      />

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

      {!!presetCourseId && (
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
          Pre-filled to tie this resource to the course you came from. Change visibility above to detach it.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting && <IconSpinner className="text-white/80" />}
        {submitting ? "Creating…" : "Create draft resource"}
      </button>
    </form>
  );
}
