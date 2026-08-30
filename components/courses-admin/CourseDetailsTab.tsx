"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ApiError } from "@/lib/api/client";
import { updateCourse } from "@/lib/api/courses-client";
import type { Course, CourseCategory, CourseLevel } from "@/lib/api/courses.types";
import { IconBookOpen, IconSpinner } from "@/components/dashboard/icons";
import { TextField, TextAreaField, SelectField, ToggleField } from "./FormControls";
import { DynamicStringListInput } from "./DynamicStringListInput";
import { CATEGORY_OPTIONS, LEVEL_OPTIONS } from "./constants";
import { ThumbnailUploader } from "./ThumbnailUploader";
import { InstructorsInput } from "./InstructorsInput";
import type { CourseInstructorInputDTO, AccessMode } from "@/lib/api/courses.types";

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
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function CourseDetailsTab({
  course,
  onUpdated,
}: {
  course: Course;
  onUpdated: (fields: Partial<Course>) => void;
}) {
  const { data: session } = useSession();

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [prerequisite, setPrerequisite] = useState(course.prerequisite ?? "");
  const [level, setLevel] = useState<CourseLevel>(course.level);
  const [category, setCategory] = useState<CourseCategory>(course.category);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(course.what_you_will_learn);
  const [materialIncludes, setMaterialIncludes] = useState<string[]>(course.material_includes);
  const [requirements, setRequirements] = useState<string[]>(course.requirements);
  const [isFree, setIsFree] = useState(course.is_free);
  const [isExclusive, setIsExclusive] = useState(course.is_exclusive);
  const [certificateEnabled, setCertificateEnabled] = useState(course.certificate_enabled ?? false);
  const [price, setPrice] = useState(course.price != null ? String(course.price) : "");
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? "");
  const [instructors, setInstructors] = useState<CourseInstructorInputDTO[]>(
    course.instructors && course.instructors.length > 0
      ? course.instructors
      : [{ name: "", user_id: null }]
  );

  useEffect(() => {
    if (
      session?.user &&
      (!course.instructors || course.instructors.length === 0) &&
      instructors.length === 1 &&
      !instructors[0].name &&
      !instructors[0].user_id
    ) {
      setInstructors([
        {
          name: `${session.user.firstName} ${session.user.lastName}`.trim(),
          user_id: session.user.id,
        },
      ]);
    }
  }, [session?.user, course.instructors]);

  const [accessMode, setAccessMode] = useState<AccessMode>(course.access_mode ?? "SELF_PACED");
  
  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatForInput = (isoDate: string | null) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    // Pad with leading zeros
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const DD = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  const [accessStartDate, setAccessStartDate] = useState(formatForInput(course.access_start_date));
  const [accessEndDate, setAccessEndDate] = useState(formatForInput(course.access_end_date));
  
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
        is_exclusive: isExclusive,
        instructors: instructors.filter((i) => i.name.trim()),
        access_mode: accessMode,
        access_start_date: accessMode === "SCHEDULED" && accessStartDate ? new Date(accessStartDate).toISOString() : null,
        access_end_date: accessMode === "SCHEDULED" && accessEndDate ? new Date(accessEndDate).toISOString() : null,
        certificate_enabled: certificateEnabled,
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
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="flex flex-col gap-5 min-w-0">
        <FormSection title="Basics" description="The core information students see first.">
          <TextField label="Title" id="title" value={title} onChange={setTitle} required />
          <TextAreaField label="Description" id="description" value={description} onChange={setDescription} required />
          <TextField label="Prerequisite" id="prerequisite" value={prerequisite} onChange={setPrerequisite} placeholder="Optional" />
        </FormSection>

        <FormSection title="Thumbnail" description="Shown on course cards and this page's header.">
          <ThumbnailUploader
            courseId={course.id}
            currentThumbnail={thumbnailUrl}
            onThumbnailUploaded={setThumbnailUrl}
          />
        </FormSection>

        <FormSection title="Classification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Category" id="category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} required />
            <SelectField label="Level" id="level" value={level} onChange={setLevel} options={LEVEL_OPTIONS} required />
          </div>
        </FormSection>

        <FormSection title="Instructors">
          <InstructorsInput value={instructors} onChange={setInstructors} />
        </FormSection>

        <FormSection title="What students get">
          <DynamicStringListInput label="What you'll learn" values={whatYouWillLearn} onChange={setWhatYouWillLearn} />
          <DynamicStringListInput label="Material includes" values={materialIncludes} onChange={setMaterialIncludes} />
          <DynamicStringListInput label="Requirements" values={requirements} onChange={setRequirements} />
        </FormSection>

        <FormSection title="Access & Scheduling">
          <ToggleField
            label="Scheduled Access"
            hint="Limit access to this course to a specific date window."
            checked={accessMode === "SCHEDULED"}
            onChange={(checked) => setAccessMode(checked ? "SCHEDULED" : "SELF_PACED")}
          />
          {accessMode === "SCHEDULED" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="accessStartDate" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Access Start Date
                </label>
                <input
                  type="datetime-local"
                  id="accessStartDate"
                  value={accessStartDate}
                  onChange={(e) => setAccessStartDate(e.target.value)}
                  required
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="accessEndDate" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Access End Date
                </label>
                <input
                  type="datetime-local"
                  id="accessEndDate"
                  value={accessEndDate}
                  onChange={(e) => setAccessEndDate(e.target.value)}
                  required
                  min={accessStartDate}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                />
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Pricing & Visibility">
          <ToggleField label="This course is free" checked={isFree} onChange={setIsFree} />
          {!isFree && (
            <TextField
              label="Price (₦)"
              id="price"
              value={price}
              onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            />
          )}
          <div className="h-px bg-gray-100 dark:bg-gray-800" />
          <ToggleField
            label="Exclusive Course"
            hint="Hide this course from standard subscriptions. Users will need to purchase it directly."
            checked={isExclusive}
            onChange={setIsExclusive}
          />
          <div className="h-px bg-gray-100 dark:bg-gray-800" />
          <ToggleField
            label="Certificates enabled"
            hint="Allow students to earn a certificate on completion. Keep off for courses that get continuous content updates."
            checked={certificateEnabled}
            onChange={setCertificateEnabled}
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
              <IconBookOpen />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{title || "Untitled course"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isFree ? "Free" : price ? `₦${Number(price).toLocaleString()}` : "No price set"}
              {isExclusive ? " · Exclusive" : ""}
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
