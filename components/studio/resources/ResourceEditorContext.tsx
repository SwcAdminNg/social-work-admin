"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  finalizeAttachmentDocument,
  getManagedResource,
  refreshAttachmentVideoUpload,
} from "@/lib/api/resources-client";
import type { ResourceManageDetail } from "@/lib/api/resources.types";
import { UploadsProvider, type UploadApi } from "@/components/studio/curriculum/uploads";

export const resourceKeys = {
  all: ["studio", "resources"] as const,
  list: (params: Record<string, unknown>) => ["studio", "resources", "list", params] as const,
  detail: (id: string) => ["studio", "resources", "detail", id] as const,
};

type RunOptions = { success?: string; refresh?: boolean; silent?: boolean };

type ResourceEditorValue = {
  resourceId: string;
  resource: ResourceManageDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  /** Run a write: toasts errors, re-fetches afterwards, resolves to undefined on failure. */
  run: <T>(fn: () => Promise<T>, opts?: RunOptions) => Promise<T | undefined>;
  /** Optimistic local update (e.g. a reorder) before the server answers. */
  setResource: (update: (prev: ResourceManageDetail) => ResourceManageDetail) => void;
};

const Ctx = createContext<ResourceEditorValue | null>(null);

const RESOURCE_UPLOAD_API: UploadApi = {
  refreshVideoUpload: refreshAttachmentVideoUpload,
  finalizeDocument: (id, payload) =>
    finalizeAttachmentDocument(id, { mime_type: payload.mime_type ?? "application/octet-stream", file_size_bytes: payload.file_size_bytes ?? 0 }),
};

export function ResourceEditorProvider({
  resourceId,
  initialResource,
  children,
}: {
  resourceId: string;
  initialResource: ResourceManageDetail;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const key = resourceKeys.detail(resourceId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getManagedResource(resourceId),
    initialData: initialResource,
    staleTime: 10_000,
    // Poll while a video is still processing so its status flips to ready on its own.
    refetchInterval: (q) => {
      const r = q.state.data as ResourceManageDetail | undefined;
      const processing = r?.attachments?.some(
        (a) => a.attachment_type === "VIDEO" && (a.video?.status === "PENDING" || a.video?.status === "PROCESSING") && a.video?.bunny_video_guid,
      );
      return processing ? 5_000 : false;
    },
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: resourceKeys.all });
  }, [queryClient]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, opts: RunOptions = {}) => {
      try {
        const result = await fn();
        if (opts.success) toast.success(opts.success);
        if (opts.refresh !== false) await queryClient.invalidateQueries({ queryKey: resourceKeys.all });
        return result;
      } catch (err) {
        if (opts.silent) throw err;
        toast.error(err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong");
        return undefined;
      }
    },
    [queryClient],
  );

  const setResource = useCallback(
    (update: (prev: ResourceManageDetail) => ResourceManageDetail) =>
      queryClient.setQueryData<ResourceManageDetail>(key, (prev) => (prev ? update(prev) : prev)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, resourceId],
  );

  const value = useMemo<ResourceEditorValue>(
    () => ({
      resourceId,
      resource: query.data,
      isLoading: query.isPending,
      error: (query.error as Error) ?? null,
      refresh,
      run,
      setResource,
    }),
    [resourceId, query.data, query.isPending, query.error, refresh, run, setResource],
  );

  return (
    <Ctx.Provider value={value}>
      <UploadsProvider api={RESOURCE_UPLOAD_API} run={run} refresh={refresh}>
        {children}
      </UploadsProvider>
    </Ctx.Provider>
  );
}

export function useResourceEditor() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useResourceEditor must be used inside <ResourceEditorProvider>");
  return ctx;
}
