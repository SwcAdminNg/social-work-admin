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
import { reorderAttachments } from "@/lib/api/resources-client";
import type { ResourceAttachment, ResourceDocumentUploadCredentials } from "@/lib/api/resources.types";
import type { ResourceEditorAction } from "./resourceEditorReducer";
import { AttachmentRow } from "./AttachmentRow";

export function AttachmentList({
  resourceId,
  attachments,
  dispatch,
  onRefresh,
  documentUploadCredentials,
  newlyCreatedAttachmentId,
}: {
  resourceId: string;
  attachments: ResourceAttachment[];
  dispatch: React.Dispatch<ResourceEditorAction>;
  onRefresh: () => void;
  documentUploadCredentials: Record<string, ResourceDocumentUploadCredentials>;
  newlyCreatedAttachmentId: string | null;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = attachments.findIndex((a) => a.id === active.id);
    const newIndex = attachments.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(attachments, oldIndex, newIndex).map((attachment, index) => ({
      ...attachment,
      order_index: index,
    }));
    dispatch({ type: "SET_ATTACHMENTS", attachments: reordered });

    try {
      await reorderAttachments(resourceId, {
        attachments: reordered.map((a) => ({ id: a.id, order_index: a.order_index })),
      });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to reorder attachments.");
      onRefresh();
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={attachments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              dispatch={dispatch}
              onRequestRefresh={onRefresh}
              documentUploadCredentials={documentUploadCredentials[attachment.id]}
              defaultExpanded={attachment.id === newlyCreatedAttachmentId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
