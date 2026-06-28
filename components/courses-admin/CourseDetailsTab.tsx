"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { updateCourse } from "@/lib/api/courses-client";
import type { Course, CourseCategory, CourseLevel } from "@/lib/api/courses.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { TextField, TextAreaField, SelectField, ToggleField } from "./FormControls";
import { DynamicStringListInput } from "./DynamicStringListInput";
import { CATEGORY_OPTIONS, LEVEL_OPTIONS } from "./constants";

export function CourseDetailsTab({
  course,
  onUpdated,
}: {
  course: Course;
  onUpdated: (fields: Partial<Course>) => void;
}) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [prerequisite, setPrerequisite] = useState(course.prerequisite ?? "");
  const [level, setLevel] = useState<CourseLevel>(course.level);
  const [category, setCategory] = useState<CourseCategory>(course.category);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(course.what_you_will_learn);
  const [materialIncludes, setMaterialIncludes] = useState<string[]>(course.material_includes);
  const [requirements, setRequirements] = useState<string[]>(course.requirements);
  const [isFree, setIsFree] = useState(course.is_free);
  const [price, setPrice] = useState(course.price != null ? String(course.price) : "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        prerequisite: prerequisite || null,
        level,
        category,
        what_you_will_learn: whatYouWillLearn,
        material_includes: materialIncludes,
        requirements,
        is_free: isFree,
        price: isFree ? null : price ? Number(price) : null,
        thumbnail_url: thumbnailUrl || null,
      };
      const updated = await updateCourse(course.id, payload);
      onUpdated(updated);
      toast.success("Course details saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save course details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 max-w-2xl"
    >
      <TextField label="Title" id="title" value={title} onChange={setTitle} required />
      <TextAreaField label="Description" id="description" value={description} onChange={setDescription} required />
      <TextField label="Prerequisite" id="prerequisite" value={prerequisite} onChange={setPrerequisite} placeholder="Optional" />
      <TextField
        label="Thumbnail URL"
        id="thumbnail_url"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
        placeholder="https://…"
        hint="Optional — paste a hosted image URL."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField label="Category" id="category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} required />
        <SelectField label="Level" id="level" value={level} onChange={setLevel} options={LEVEL_OPTIONS} required />
      </div>

      <DynamicStringListInput label="What you'll learn" values={whatYouWillLearn} onChange={setWhatYouWillLearn} />
      <DynamicStringListInput label="Material includes" values={materialIncludes} onChange={setMaterialIncludes} />
      <DynamicStringListInput label="Requirements" values={requirements} onChange={setRequirements} />

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <ToggleField label="This course is free" checked={isFree} onChange={setIsFree} />
        {!isFree && (
          <TextField
            label="Price (₦)"
            id="price"
            value={price}
            onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving && <IconSpinner className="text-white/80" />}
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
