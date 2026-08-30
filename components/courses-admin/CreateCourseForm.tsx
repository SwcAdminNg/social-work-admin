"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ApiError } from "@/lib/api/client";
import { createCourse } from "@/lib/api/courses-client";
import type { CourseCategory, CourseLevel } from "@/lib/api/courses.types";
import { IconSpinner } from "@/components/dashboard/icons";
import { TextField, TextAreaField, SelectField, ToggleField } from "./FormControls";
import { DynamicStringListInput } from "./DynamicStringListInput";
import { CATEGORY_OPTIONS, LEVEL_OPTIONS } from "./constants";
import { InstructorsInput } from "./InstructorsInput";
import type { CourseInstructorInputDTO, AccessMode } from "@/lib/api/courses.types";

export function CreateCourseForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prerequisite, setPrerequisite] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");
  const [category, setCategory] = useState<CourseCategory>("DEVELOPMENT");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>([]);
  const [materialIncludes, setMaterialIncludes] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [isFree, setIsFree] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [price, setPrice] = useState("");
  const [instructors, setInstructors] = useState<CourseInstructorInputDTO[]>([{ name: "", user_id: null }]);

  useEffect(() => {
    if (
      session?.user &&
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  const [accessMode, setAccessMode] = useState<AccessMode>("SELF_PACED");
  const [accessStartDate, setAccessStartDate] = useState("");
  const [accessEndDate, setAccessEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const course = await createCourse({
        title,
        description,
        prerequisite: prerequisite || null,
        level,
        what_you_will_learn: whatYouWillLearn,
        category,
        material_includes: materialIncludes,
        requirements,
        is_free: isFree,
        price: isFree ? null : price ? Number(price) : null,
        thumbnail_url: null,
        is_exclusive: isExclusive,
        instructors: instructors.filter((i) => i.name.trim()),
        access_mode: accessMode,
        access_start_date: accessMode === "SCHEDULED" && accessStartDate ? new Date(accessStartDate).toISOString() : null,
        access_end_date: accessMode === "SCHEDULED" && accessEndDate ? new Date(accessEndDate).toISOString() : null,
        certificate_enabled: certificateEnabled,
      });
      toast.success("Course created as a draft.");
      router.push(`/dashboard/course-management/${course.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create course.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
      <TextField label="Title" id="title" value={title} onChange={setTitle} required placeholder="e.g. Ethics in Social Work" />
      <TextAreaField label="Description" id="description" value={description} onChange={setDescription} required placeholder="What will learners get from this course?" />
      <TextField
        label="Prerequisite"
        id="prerequisite"
        value={prerequisite}
        onChange={setPrerequisite}
        placeholder="Optional"
        hint="Leave blank if there's no prerequisite."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField label="Category" id="category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} required />
        <SelectField label="Level" id="level" value={level} onChange={setLevel} options={LEVEL_OPTIONS} required />
      </div>

      <InstructorsInput value={instructors} onChange={setInstructors} />

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <ToggleField
          label="Scheduled Access"
          hint="Limit access to this course to a specific date window."
          checked={accessMode === "SCHEDULED"}
          onChange={(checked) => setAccessMode(checked ? "SCHEDULED" : "SELF_PACED")}
        />
        {accessMode === "SCHEDULED" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
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
      </div>

      <DynamicStringListInput
        label="What you'll learn"
        placeholder="e.g. Understand client confidentiality"
        values={whatYouWillLearn}
        onChange={setWhatYouWillLearn}
      />
      <DynamicStringListInput
        label="Material includes"
        placeholder="e.g. 5 hours of video"
        values={materialIncludes}
        onChange={setMaterialIncludes}
      />
      <DynamicStringListInput
        label="Requirements"
        placeholder="e.g. A computer with internet access"
        values={requirements}
        onChange={setRequirements}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <ToggleField
          label="This course is free"
          hint="Turn off to set a price."
          checked={isFree}
          onChange={setIsFree}
        />
        {!isFree && (
          <TextField
            label="Price (₦)"
            id="price"
            value={price}
            onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 15000"
          />
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <ToggleField
          label="Exclusive Course"
          hint="Hide this course from standard subscriptions. Users will need to purchase it directly."
          checked={isExclusive}
          onChange={setIsExclusive}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <ToggleField
          label="Certificates enabled"
          hint="Allow students to earn a certificate on completion. Keep off for courses that get continuous content updates."
          checked={certificateEnabled}
          onChange={setCertificateEnabled}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] shadow-lg shadow-green-900/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting && <IconSpinner className="text-white/80" />}
        {submitting ? "Creating…" : "Create draft course"}
      </button>
    </form>
  );
}
