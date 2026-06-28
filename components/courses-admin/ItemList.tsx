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
import { reorderItems } from "@/lib/api/courses-client";
import type { CourseSection } from "@/lib/api/courses.types";
import type { CourseEditorAction } from "./courseEditorReducer";
import { ItemRow } from "./ItemRow";

export function ItemList({
  courseId,
  section,
  dispatch,
  onRefresh,
  documentUploadCredentials,
}: {
  courseId: string;
  section: CourseSection;
  dispatch: React.Dispatch<CourseEditorAction>;
  onRefresh: () => void;
  documentUploadCredentials: Record<string, { upload_url: string; storage_key: string }>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = section.items.findIndex((i) => i.id === active.id);
    const newIndex = section.items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(section.items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order_index: index,
    }));
    dispatch({ type: "SET_SECTION_ITEMS", sectionId: section.id, items: reordered });

    try {
      await reorderItems(courseId, section.id, {
        items: reordered.map((i) => ({ id: i.id, order_index: i.order_index })),
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to reorder items.");
      onRefresh();
    }
  }

  if (section.items.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-600 px-1 py-3">
        No items yet — add a video, document, or quiz to this section.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {section.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              dispatch={dispatch}
              onRequestRefresh={onRefresh}
              documentUploadCredentials={documentUploadCredentials[item.id]}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
