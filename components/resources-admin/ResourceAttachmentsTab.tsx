"use client";

import { useState } from "react";
import type {
  ResourceManageDetail,
  CreateAttachmentResult,
  ResourceDocumentUploadCredentials,
} from "@/lib/api/resources.types";
import { IconLink, IconPlus } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { ResourceEditorAction } from "./resourceEditorReducer";
import { AttachmentList } from "./AttachmentList";
import { AddAttachmentModal } from "./AddAttachmentModal";

export function ResourceAttachmentsTab({
  resource,
  dispatch,
  onRefresh,
}: {
  resource: ResourceManageDetail;
  dispatch: React.Dispatch<ResourceEditorAction>;
  onRefresh: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [documentUploadCredentials, setDocumentUploadCredentials] = useState<
    Record<string, ResourceDocumentUploadCredentials>
  >({});
  const [newlyCreatedAttachmentId, setNewlyCreatedAttachmentId] = useState<string | null>(null);

  function handleAttachmentCreated(result: CreateAttachmentResult) {
    const { video_upload, document_upload, ...attachment } = result;
    dispatch({ type: "ADD_ATTACHMENT", attachment });
    setNewlyCreatedAttachmentId(attachment.id);
    if (document_upload) {
      setDocumentUploadCredentials((prev) => ({ ...prev, [attachment.id]: document_upload }));
    }
    void video_upload;
  }

  return (
    <div className="flex flex-col gap-4">
      {resource.attachments.length === 0 ? (
        <EmptyState
          icon={IconLink}
          title="No attachments yet"
          description="Add a video, document, or link so viewers have something to open."
        />
      ) : (
        <AttachmentList
          resourceId={resource.id}
          attachments={resource.attachments}
          dispatch={dispatch}
          onRefresh={onRefresh}
          documentUploadCredentials={documentUploadCredentials}
          newlyCreatedAttachmentId={newlyCreatedAttachmentId}
        />
      )}

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#2D6A4F] dark:text-[#52b788] border-2 border-dashed border-[#2D6A4F]/30 dark:border-[#52b788]/30 hover:bg-[#2D6A4F]/5 dark:hover:bg-[#52b788]/10 transition-colors duration-150 cursor-pointer"
      >
        <IconPlus />
        Add attachment
      </button>

      <AddAttachmentModal
        open={addOpen}
        resourceId={resource.id}
        nextOrderIndex={resource.attachments.length}
        onClose={() => setAddOpen(false)}
        onCreated={handleAttachmentCreated}
      />
    </div>
  );
}
