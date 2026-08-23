"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { reorderSections } from "@/lib/api/courses-client";
import type { CourseDetail, CreateItemResult } from "@/lib/api/courses.types";
import type { CourseEditorAction } from "./courseEditorReducer";
import { SectionCard } from "./SectionCard";

export function SectionList({
  course,
  dispatch,
  onRefresh,
  onItemCreated,
  documentUploadCredentials,
  newlyCreatedItemId,
}: {
  course: CourseDetail;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRefresh: () => void;
  onItemCreated: (sectionId: string, result: CreateItemResult) => void;
  documentUploadCredentials: Record<string, { upload_url: string; storage_key: string }>;
  newlyCreatedItemId: string | null;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = course.sections.findIndex((s) => s.id === active.id);
    const newIndex = course.sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(course.sections, oldIndex, newIndex).map((s, index) => ({
      ...s,
      order_index: index,
    }));
    dispatch({ type: "SET_SECTIONS", sections: reordered });

    try {
      await reorderSections(course.id, {
        sections: reordered.map((s) => ({ id: s.id, order_index: s.order_index })),
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to reorder sections.");
      onRefresh();
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={course.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {course.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              course={course}
              section={section}
              index={index}
              dispatch={dispatch}
              onRefresh={onRefresh}
              onItemCreated={onItemCreated}
              documentUploadCredentials={documentUploadCredentials}
              newlyCreatedItemId={newlyCreatedItemId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
