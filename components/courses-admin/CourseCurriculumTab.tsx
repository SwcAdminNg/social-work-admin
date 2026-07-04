"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { createSection } from "@/lib/api/courses-client";
import type { CourseDetail, CreateItemResult, DocumentUploadCredentials } from "@/lib/api/courses.types";
import { IconBookOpen, IconPlus, IconSpinner } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { CourseEditorAction } from "./courseEditorReducer";
import { SectionList } from "./SectionList";

export function CourseCurriculumTab({
  course,
  dispatch,
  onRefresh,
}: {
  course: CourseDetail;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRefresh: () => void;
}) {
  const [addingSection, setAddingSection] = useState(false);
  const [documentUploadCredentials, setDocumentUploadCredentials] = useState<
    Record<string, DocumentUploadCredentials>
  >({});
  const [newlyCreatedItemId, setNewlyCreatedItemId] = useState<string | null>(null);

  async function handleAddSection() {
    setAddingSection(true);
    try {
      const section = await createSection(course.id, {
        title: `Section ${course.sections.length + 1}`,
        order_index: course.sections.length,
      });
      dispatch({ type: "ADD_SECTION", section: { ...section, items: [] } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add section.");
    } finally {
      setAddingSection(false);
    }
  }

  function handleItemCreated(sectionId: string, result: CreateItemResult) {
    const { video_upload, document_upload, ...item } = result;
    dispatch({ type: "ADD_ITEM", sectionId, item });
    setNewlyCreatedItemId(item.id);
    if (document_upload) {
      setDocumentUploadCredentials((prev) => ({ ...prev, [item.id]: document_upload }));
    }
    toast.success("Item added.");
    void video_upload;
  }

  return (
    <div className="flex flex-col gap-4">
      {course.sections.length === 0 ? (
        <EmptyState
          icon={IconBookOpen}
          title="No sections yet"
          description="Add your first section to start building the curriculum."
        />
      ) : (
        <SectionList
          course={course}
          dispatch={dispatch}
          onRefresh={onRefresh}
          onItemCreated={handleItemCreated}
          documentUploadCredentials={documentUploadCredentials}
          newlyCreatedItemId={newlyCreatedItemId}
        />
      )}

      <button
        type="button"
        onClick={handleAddSection}
        disabled={addingSection}
        className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#2D6A4F] dark:text-[#52b788] border-2 border-dashed border-[#2D6A4F]/30 dark:border-[#52b788]/30 hover:bg-[#2D6A4F]/5 dark:hover:bg-[#52b788]/10 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {addingSection ? <IconSpinner /> : <IconPlus />}
        Add section
      </button>
    </div>
  );
}
