"use client";

// Background uploads for curriculum items and resource attachments. Uploads
// keep going while the author carries on editing (dialogs and drawers can
// close); rows and the editors read progress from here.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { toast } from "sonner";
import { studioApi, uploadToSignedUrl } from "@/lib/studio/api";
import type { VideoUploadCredentials } from "@/lib/studio/types";
import { useCourseEditor } from "../editor/CourseEditorContext";

export type UploadState = {
  itemId: string;
  kind: "video" | "document" | "scorm";
  fileName: string;
  progress: number;
  phase: "preparing" | "uploading" | "finalizing" | "error";
  error?: string;
};

/** The two backend calls an upload needs; courses and resources use different routes. */
export type UploadApi = {
  refreshVideoUpload: (id: string) => Promise<VideoUploadCredentials>;
  finalizeDocument: (id: string, payload: { mime_type?: string; file_size_bytes?: number }) => Promise<unknown>;
  /** Optional: only curriculum items can hold interactive packages. */
  finalizeScorm?: (id: string, payload: { file_size_bytes?: number }) => Promise<unknown>;
};

type RunFn = <T>(fn: () => Promise<T>, opts?: { success?: string; refresh?: boolean; silent?: boolean }) => Promise<T | undefined>;

type UploadsValue = {
  uploads: Record<string, UploadState>;
  get: (itemId: string) => UploadState | undefined;
  /** TUS upload to the video host. Fetches fresh credentials when none are given. */
  startVideo: (itemId: string, file: File, opts?: { credentials?: VideoUploadCredentials | null; title?: string }) => void;
  /** PUT to a signed URL, then finalize the document item. */
  startDocument: (itemId: string, file: File, uploadUrl: string) => Promise<boolean>;
  /** PUT the package zip to a signed URL, then finalize (validate + unpack) the SCORM item. */
  startScorm: (itemId: string, file: File, uploadUrl: string) => Promise<boolean>;
  cancel: (itemId: string) => void;
  dismiss: (itemId: string) => void;
  busy: boolean;
};

const Ctx = createContext<UploadsValue | null>(null);

export function UploadsProvider({
  api,
  run,
  refresh,
  children,
}: {
  api: UploadApi;
  /** Write wrapper: toasts errors and resolves to undefined on failure. */
  run: RunFn;
  /** Re-fetch after an upload completes. */
  refresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const tusUploads = useRef<Record<string, tus.Upload>>({});

  const patch = useCallback((itemId: string, next: Partial<UploadState> | null) => {
    setUploads((all) => {
      if (next === null) {
        const rest = { ...all };
        delete rest[itemId];
        return rest;
      }
      return { ...all, [itemId]: { ...all[itemId], ...next } as UploadState };
    });
  }, []);

  const startVideo = useCallback<UploadsValue["startVideo"]>(
    (itemId, file, opts = {}) => {
      patch(itemId, { itemId, kind: "video", fileName: file.name, progress: 0, phase: "preparing", error: undefined });
      void (async () => {
        const creds = opts.credentials ?? (await run(() => api.refreshVideoUpload(itemId), { refresh: false }));
        if (!creds) {
          patch(itemId, { phase: "error", error: "Couldn't start the upload. Try again." });
          return;
        }
        patch(itemId, { phase: "uploading" });
        const upload = new tus.Upload(file, {
          endpoint: creds.tus_endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 50 * 1024 * 1024,
          headers: {
            AuthorizationSignature: creds.authorization_signature,
            AuthorizationExpire: String(creds.authorization_expire),
            VideoId: creds.video_id,
            LibraryId: String(creds.library_id),
          },
          metadata: { filetype: file.type || "video/mp4", title: opts.title || file.name },
          onProgress: (sent, total) => patch(itemId, { progress: total ? Math.round((sent / total) * 100) : 0 }),
          onError: (err) => {
            delete tusUploads.current[itemId];
            patch(itemId, { phase: "error", error: err.message || "The upload was interrupted." });
            toast.error(`Video upload failed: ${file.name}`);
          },
          onSuccess: () => {
            delete tusUploads.current[itemId];
            patch(itemId, null);
            toast.success("Video uploaded — it's processing now");
            void refresh();
          },
        });
        tusUploads.current[itemId] = upload;
        upload.start();
      })();
    },
    [patch, refresh, run, api],
  );

  const startDocument = useCallback<UploadsValue["startDocument"]>(
    async (itemId, file, uploadUrl) => {
      patch(itemId, { itemId, kind: "document", fileName: file.name, progress: 0, phase: "uploading", error: undefined });
      try {
        await uploadToSignedUrl(uploadUrl, file, (p) => patch(itemId, { progress: p }));
      } catch (err) {
        patch(itemId, { phase: "error", error: (err as Error).message });
        toast.error(`Document upload failed: ${file.name}`);
        return false;
      }
      patch(itemId, { phase: "finalizing", progress: 100 });
      const ok = await run(
        async () => {
          await api.finalizeDocument(itemId, { mime_type: file.type || undefined, file_size_bytes: file.size });
          return true;
        },
        { success: "Document uploaded" },
      );
      if (!ok) {
        patch(itemId, { phase: "error", error: "Uploaded, but we couldn't confirm it. Try again." });
        return false;
      }
      patch(itemId, null);
      return true;
    },
    [patch, run, api],
  );

  const startScorm = useCallback<UploadsValue["startScorm"]>(
    async (itemId, file, uploadUrl) => {
      patch(itemId, { itemId, kind: "scorm", fileName: file.name, progress: 0, phase: "uploading", error: undefined });
      try {
        await uploadToSignedUrl(uploadUrl, file, (p) => patch(itemId, { progress: p }));
      } catch (err) {
        patch(itemId, { phase: "error", error: (err as Error).message });
        toast.error(`Package upload failed: ${file.name}`);
        return false;
      }
      // Finalize validates the zip and unpacks it; a bad package comes back as
      // a 400 whose message says what to fix.
      patch(itemId, { phase: "finalizing", progress: 100 });
      try {
        await run(
          async () => {
            await (api.finalizeScorm ?? studioApi.finalizeScorm)(itemId, { file_size_bytes: file.size });
            return true;
          },
          { success: "Package uploaded and ready to play", silent: true },
        );
      } catch (err) {
        patch(itemId, { phase: "error", error: (err as Error).message || "We couldn't unpack the package. Try another zip." });
        toast.error(`Package rejected: ${file.name}`);
        return false;
      }
      patch(itemId, null);
      return true;
    },
    [patch, run, api],
  );

  const cancel = useCallback(
    (itemId: string) => {
      const u = tusUploads.current[itemId];
      if (u) void u.abort(true);
      delete tusUploads.current[itemId];
      patch(itemId, null);
    },
    [patch],
  );

  const busy = Object.values(uploads).some((u) => u.phase !== "error");

  // Warn before leaving the page mid-upload.
  useEffect(() => {
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy]);

  const value = useMemo<UploadsValue>(
    () => ({
      uploads,
      get: (id) => uploads[id],
      startVideo,
      startDocument,
      startScorm,
      cancel,
      dismiss: (id) => patch(id, null),
      busy,
    }),
    [uploads, startVideo, startDocument, startScorm, cancel, patch, busy],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const COURSE_UPLOAD_API: UploadApi = {
  refreshVideoUpload: studioApi.refreshVideoUpload,
  finalizeDocument: studioApi.finalizeDocument,
  finalizeScorm: studioApi.finalizeScorm,
};

/** Uploads wired to the course item endpoints and the course editor's write wrapper. */
export function CourseUploadsProvider({ children }: { children: React.ReactNode }) {
  const { run, refresh } = useCourseEditor();
  return (
    <UploadsProvider api={COURSE_UPLOAD_API} run={run} refresh={refresh}>
      {children}
    </UploadsProvider>
  );
}

export function useUploads() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUploads must be used inside <UploadsProvider>");
  return ctx;
}
