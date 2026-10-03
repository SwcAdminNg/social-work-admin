"use client";

import { useId, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge, Button, Callout, Card, CardHeader, ChoiceCard, EmptyState, Field, Input, ProgressBar, Switch, Textarea, cn, toneClasses } from "@/components/ui/primitives";
import { ConfirmDialog, Dialog, Sheet } from "@/components/ui/overlays";
import { FileDrop } from "@/components/studio/curriculum/FileDrop";
import { verticalOnly } from "@/components/studio/curriculum/SectionCard";
import { UploadProgressCard, VideoPanel } from "@/components/studio/curriculum/VideoUpload";
import { useUploads } from "@/components/studio/curriculum/uploads";
import { useDraft } from "@/components/studio/editor/useDraft";
import { formatBytes } from "@/lib/studio/labels";
import { createAttachment, deleteAttachment, reorderAttachments, updateAttachment } from "@/lib/api/resources-client";
import type { ResourceAttachment, ResourceAttachmentType, UpdateAttachmentPayload } from "@/lib/api/resources.types";
import { useResourceEditor } from "./ResourceEditorContext";
import { ATTACHMENT_META, attachmentIssue, plural } from "./resourceMeta";

const fileTitle = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

function hostOf(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isWebUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return /^https?:$/.test(u.protocol) && value.trim().length <= 2000;
  } catch {
    return false;
  }
}

/* ───────────────────────── Row ───────────────────────── */

function StatusBadges({ attachment: a }: { attachment: ResourceAttachment }) {
  if (a.attachment_type === "VIDEO") {
    const s = a.video?.status;
    if (s === "PROCESSING")
      return (
        <Badge tone="info" size="xs" dot pulse>
          Processing
        </Badge>
      );
    if (s === "FAILED")
      return (
        <Badge tone="danger" size="xs">
          Processing failed
        </Badge>
      );
    if (s !== "READY")
      return (
        <Badge tone="warning" size="xs">
          {a.video?.bunny_video_guid ? "Awaiting video" : "No video yet"}
        </Badge>
      );
  }
  if (a.attachment_type === "DOCUMENT") {
    if (!a.document?.is_uploaded)
      return (
        <Badge tone="warning" size="xs">
          Upload incomplete
        </Badge>
      );
    if (a.document.downloadable)
      return (
        <Badge tone="brand" size="xs" icon={Download}>
          Downloadable
        </Badge>
      );
  }
  return null;
}

function AttachmentRow({ attachment: a, index, onOpen }: { attachment: ResourceAttachment; index: number; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: a.id });
  const upload = useUploads().get(a.id);
  const meta = ATTACHMENT_META[a.attachment_type];
  const Icon = meta.icon;
  const issue = attachmentIssue(a);
  const detail =
    a.attachment_type === "DOCUMENT"
      ? [a.document?.file_name, formatBytes(a.document?.file_size_bytes)].filter(Boolean).join(" · ")
      : a.attachment_type === "LINKS"
        ? hostOf(a.link?.url)
        : "";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group/item relative flex items-center gap-2 rounded-xl border border-transparent bg-white pr-2 transition-colors hover:border-slate-200 hover:bg-slate-50/80 dark:bg-transparent dark:hover:border-ink-line dark:hover:bg-white/[0.03]",
        isDragging && "z-10 border-brand-300 bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:border-brand-400/50 dark:bg-ink-raised",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${a.title}`}
        className="flex h-10 w-6 flex-shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-slate-300 opacity-60 transition hover:text-slate-500 group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-300"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 text-left outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand-400/50"
      >
        <span className={cn("relative grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(meta.tone))}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          {issue && !upload && (
            <span
              title={issue}
              className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white ring-2 ring-white dark:ring-ink-surface"
            >
              <AlertCircle className="h-3 w-3" strokeWidth={2.6} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500">{index + 1}.</span>
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</span>
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{meta.label}</span>
            {detail && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="truncate">{detail}</span>
              </>
            )}
          </span>
          {upload && (
            <span className="mt-2 flex items-center gap-2">
              {upload.phase === "error" ? (
                <span className="text-xs font-medium text-rose-600 dark:text-rose-300">Upload failed — open to retry</span>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-brand-600 dark:text-brand-300" />
                  <ProgressBar value={upload.progress} className="max-w-56" />
                  <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                    {upload.phase === "preparing" ? "Preparing…" : upload.phase === "finalizing" ? "Finishing…" : `${upload.progress}%`}
                  </span>
                </>
              )}
            </span>
          )}
        </span>
        <span className="hidden flex-shrink-0 items-center gap-1.5 sm:flex">
          <StatusBadges attachment={a} />
        </span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-slate-500 dark:text-slate-600" />
      </button>
    </li>
  );
}

/* ───────────────────────── Add dialog ───────────────────────── */

function AddAttachmentDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { resource, resourceId, run } = useResourceEditor();
  const uploads = useUploads();
  const uid = useId();
  const [kind, setKind] = useState<ResourceAttachmentType | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [downloadable, setDownloadable] = useState(true);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"title" | "file" | "url", string>>>({});
  const [busy, setBusy] = useState(false);

  function reset() {
    setKind(null);
    setTitle("");
    setFile(null);
    setDownloadable(true);
    setUrl("");
    setLabel("");
    setDescription("");
    setErrors({});
  }

  function close() {
    if (busy) return;
    reset();
    onClose();
  }

  function pickFile(f: File) {
    setFile(f);
    if (!title.trim()) setTitle(fileTitle(f.name));
    setErrors((e) => ({ ...e, file: undefined, title: undefined }));
  }

  async function submit() {
    if (!kind) return;
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Give it a title.";
    if (kind === "DOCUMENT" && !file) e.file = "Choose the file to upload.";
    if (kind === "LINKS" && !isWebUrl(url)) e.url = "Enter a full web address starting with https://";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    const created = await run(
      () =>
        createAttachment(resourceId, {
          title: title.trim(),
          attachment_type: kind,
          order_index: resource?.attachments?.length ?? 0,
          ...(kind === "DOCUMENT" ? { file_name: file!.name, downloadable } : {}),
          ...(kind === "LINKS" ? { url: url.trim(), label: label.trim() || undefined, description: description.trim() || undefined } : {}),
        }),
      { success: `${ATTACHMENT_META[kind].label} added` },
    );
    setBusy(false);
    if (!created) return;

    // Uploads continue in the background; the row and the editor show progress.
    if (kind === "VIDEO" && file) uploads.startVideo(created.id, file, { credentials: created.video_upload, title: title.trim() });
    if (kind === "DOCUMENT" && file && created.document_upload?.upload_url)
      void uploads.startDocument(created.id, file, created.document_upload.upload_url);

    reset();
    onClose();
    onCreated(created.id);
  }

  const meta = kind ? ATTACHMENT_META[kind] : null;
  const KindIcon = meta?.icon ?? Paperclip;
  const fid = (k: string) => `${uid}-${k}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
      dismissible={!busy}
      size="lg"
      icon={meta?.icon ?? Paperclip}
      iconTone="brand"
      title={meta ? `Add a ${meta.noun}` : "Add an attachment"}
      description={meta ? meta.description : "What would you like to attach to this resource?"}
      footer={
        kind ? (
          <>
            <Button variant="ghost" icon={ArrowLeft} onClick={() => setKind(null)} disabled={busy} className="sm:mr-auto">
              Change type
            </Button>
            <Button variant="outline" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button icon={Plus} loading={busy} onClick={submit}>
              Add {meta!.noun}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
        )
      }
    >
      {!kind ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(ATTACHMENT_META) as ResourceAttachmentType[]).map((k) => {
            const m = ATTACHMENT_META[k];
            return <ChoiceCard key={k} icon={m.icon} tone={m.tone} title={m.label} description={m.description} onClick={() => setKind(k)} />;
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(kind === "VIDEO" || kind === "DOCUMENT") &&
            (file ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-ink-line dark:bg-white/[0.02]">
                <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(meta!.tone))}>
                  <KindIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={busy}>
                  Change
                </Button>
              </div>
            ) : (
              <Field error={errors.file}>
                <FileDrop
                  accept={kind === "VIDEO" ? "video/*" : undefined}
                  onFile={pickFile}
                  icon={meta!.icon}
                  title={kind === "VIDEO" ? "Drop the video here or browse" : "Drop the file here or browse"}
                  hint={
                    kind === "VIDEO"
                      ? "MP4, MOV or WebM. Optional now — you can upload it later from the attachment."
                      : "PDF, Word, PowerPoint, Excel or an image."
                  }
                />
              </Field>
            ))}

          <Field label="Title" htmlFor={fid("title")} required error={errors.title}>
            <Input id={fid("title")} value={title} maxLength={255} invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          {kind === "DOCUMENT" && (
            <Switch
              checked={downloadable}
              onChange={setDownloadable}
              label="Allow downloading"
              description="When off, people can read it in the browser but not save a copy."
            />
          )}

          {kind === "LINKS" && (
            <>
              <Field label="Web address" htmlFor={fid("url")} required error={errors.url}>
                <Input id={fid("url")} type="url" value={url} invalid={!!errors.url} placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
              </Field>
              <Field label="Button label" htmlFor={fid("label")} optional>
                <Input id={fid("label")} value={label} placeholder={title || "Open link"} onChange={(e) => setLabel(e.target.value)} />
              </Field>
              <Field label="Short description" htmlFor={fid("desc")} optional>
                <Textarea id={fid("desc")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}

/* ───────────────────────── Editor sheet ───────────────────────── */

function DocumentBody({ attachment: a, onReplaced }: { attachment: ResourceAttachment; onReplaced: (newId: string) => void }) {
  const { resourceId, run } = useResourceEditor();
  const uploads = useUploads();
  const upload = uploads.get(a.id);
  const [replacing, setReplacing] = useState(false);
  const doc = a.document;

  // There's no re-upload endpoint for a document, so recovery recreates the
  // attachment in the same position with the same settings.
  async function replace(file: File) {
    setReplacing(true);
    const created = await run(
      () =>
        createAttachment(resourceId, {
          title: a.title,
          attachment_type: "DOCUMENT",
          order_index: a.order_index,
          file_name: file.name,
          downloadable: !!doc?.downloadable,
        }),
      { refresh: false },
    );
    if (created?.document_upload?.upload_url) {
      const ok = await uploads.startDocument(created.id, file, created.document_upload.upload_url);
      if (ok) {
        await run(() => deleteAttachment(a.id));
        onReplaced(created.id);
      }
    }
    setReplacing(false);
  }

  if (upload) return <UploadProgressCard upload={upload} onCancel={upload.phase === "error" ? () => uploads.dismiss(a.id) : undefined} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-ink-line dark:bg-white/[0.02]">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200 dark:bg-ink-raised dark:text-sky-300 dark:ring-ink-line">
          <FileText className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{doc?.file_name || "Untitled file"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[formatBytes(doc?.file_size_bytes), doc?.mime_type?.split("/").pop()?.toUpperCase()].filter(Boolean).join(" · ") || "No file details yet"}
          </p>
        </div>
        <Badge tone={doc?.is_uploaded ? "success" : "warning"} size="xs">
          {doc?.is_uploaded ? "Uploaded" : "Upload incomplete"}
        </Badge>
      </div>
      {!doc?.is_uploaded && (
        <>
          <Callout tone="warning" title="The file never finished uploading">
            People will see an empty document. Upload it again — we&apos;ll recreate this attachment in the same place and remove the incomplete one.
          </Callout>
          <FileDrop compact disabled={replacing} onFile={replace} icon={FileText} title={replacing ? "Re-creating the attachment…" : "Upload the file again"} hint="Drop it here or browse." />
        </>
      )}
    </div>
  );
}

function AttachmentSheet({ attachment: a, onClose, onOpen }: { attachment: ResourceAttachment; onClose: () => void; onOpen: (id: string) => void }) {
  const { run } = useResourceEditor();
  const uid = useId();
  const base = useMemo(
    () => ({
      title: a.title ?? "",
      downloadable: !!a.document?.downloadable,
      url: a.link?.url ?? "",
      label: a.link?.label ?? "",
      description: a.link?.description ?? "",
    }),
    [a],
  );
  const draft = useDraft(base);
  const v = draft.values;
  const [errors, setErrors] = useState<Partial<Record<"title" | "url", string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = ATTACHMENT_META[a.attachment_type];
  const Icon = meta.icon;
  const issue = attachmentIssue(a);
  const fid = (k: string) => `${uid}-${k}`;

  async function save() {
    const e: typeof errors = {};
    const payload: UpdateAttachmentPayload = {};
    for (const k of draft.dirtyKeys) {
      if (k === "title") {
        if (!v.title.trim()) e.title = "A title is required.";
        else payload.title = v.title.trim();
      } else if (k === "url") {
        if (!isWebUrl(v.url)) e.url = "Enter a full web address starting with https://";
        else payload.url = v.url.trim();
      } else if (k === "downloadable") payload.downloadable = v.downloadable;
      else if (k === "label") payload.label = v.label.trim() || null;
      else if (k === "description") payload.description = v.description.trim() || null;
    }
    setErrors(e);
    if (Object.keys(e).length || !Object.keys(payload).length) return;
    setSaving(true);
    const ok = await run(
      async () => {
        await updateAttachment(a.id, payload);
        return true;
      },
      { success: "Changes saved" },
    );
    setSaving(false);
    if (ok) draft.reset();
  }

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={
        <span className="flex min-w-0 items-center gap-3">
          <span className={cn("grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(meta.tone))}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <span className="truncate">{a.title}</span>
        </span>
      }
      description={meta.label}
      footer={
        <>
          <Button variant="soft-danger" icon={Trash2} onClick={() => setConfirmDelete(true)} className="mr-auto">
            Delete
          </Button>
          {draft.dirty ? (
            <>
              <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold text-amber-600 sm:inline-flex dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  draft.reset();
                  setErrors({});
                }}
                disabled={saving}
              >
                Discard
              </Button>
              <Button onClick={save} loading={saving}>
                Save changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {issue && (
          <Callout tone="warning" icon={AlertCircle}>
            {issue}.
          </Callout>
        )}

        <Card padded={false} className="p-4 sm:p-5">
          <h3 className="mb-4 font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">Basics</h3>
          <div className="flex flex-col gap-4">
            <Field label="Title" htmlFor={fid("title")} required error={errors.title}>
              <Input id={fid("title")} value={v.title} maxLength={255} invalid={!!errors.title} onChange={(e) => draft.set("title", e.target.value)} />
            </Field>
            {a.attachment_type === "DOCUMENT" && (
              <Switch
                checked={v.downloadable}
                onChange={(val) => draft.set("downloadable", val)}
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-slate-400" /> Allow downloading
                  </span>
                }
                description="When off, people can read it in the browser but not save a copy."
              />
            )}
          </div>
        </Card>

        {a.attachment_type === "VIDEO" && (
          <Card padded={false} className="p-4 sm:p-5">
            <h3 className="mb-4 font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">Video</h3>
            <VideoPanel item={a} readOnly={false} noun="video attachment" />
          </Card>
        )}

        {a.attachment_type === "DOCUMENT" && (
          <Card padded={false} className="p-4 sm:p-5">
            <h3 className="mb-4 font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">Document</h3>
            <DocumentBody attachment={a} onReplaced={onOpen} />
          </Card>
        )}

        {a.attachment_type === "LINKS" && (
          <Card padded={false} className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">Link</h3>
              {a.link?.url && (
                <a
                  href={a.link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300"
                >
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Web address" htmlFor={fid("url")} required error={errors.url}>
                <Input id={fid("url")} type="url" value={v.url} invalid={!!errors.url} onChange={(e) => draft.set("url", e.target.value)} />
              </Field>
              <Field label="Button label" htmlFor={fid("label")} optional>
                <Input id={fid("label")} value={v.label} placeholder={v.title || "Open link"} onChange={(e) => draft.set("label", e.target.value)} />
              </Field>
              <Field label="Short description" htmlFor={fid("desc")} optional>
                <Textarea id={fid("desc")} rows={2} value={v.description} onChange={(e) => draft.set("description", e.target.value)} />
              </Field>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${a.title}”?`}
        description="It will be removed from this resource. This can't be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          const ok = await run(
            async () => {
              await deleteAttachment(a.id);
              return true;
            },
            { success: `${meta.label} deleted` },
          );
          if (!ok) throw new Error("failed");
          onClose();
        }}
      />
    </Sheet>
  );
}

/* ───────────────────────── Panel ───────────────────────── */

export function AttachmentsPanel() {
  const { resource, resourceId, run, setResource } = useResourceEditor();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // A stable id keeps dnd-kit's aria-describedby identical on server and client (no hydration mismatch).
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const attachments = useMemo(
    () => [...(resource?.attachments ?? [])].sort((a, b) => a.order_index - b.order_index),
    [resource?.attachments],
  );
  const open = attachments.find((a) => a.id === openId) ?? null;
  const counts = {
    videos: attachments.filter((a) => a.attachment_type === "VIDEO").length,
    documents: attachments.filter((a) => a.attachment_type === "DOCUMENT").length,
    links: attachments.filter((a) => a.attachment_type === "LINKS").length,
  };

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = attachments.findIndex((a) => a.id === active.id);
    const to = attachments.findIndex((a) => a.id === over.id);
    const next = arrayMove(attachments, from, to).map((a, i) => ({ ...a, order_index: i }));
    setResource((prev) => ({ ...prev, attachments: next }));
    setSaving(true);
    await run(() => reorderAttachments(resourceId, { attachments: next.map((a) => ({ id: a.id, order_index: a.order_index })) }));
    setSaving(false);
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardHeader
          title="Attachments"
          description={
            attachments.length
              ? `${[counts.videos && plural(counts.videos, "video"), counts.documents && plural(counts.documents, "document"), counts.links && plural(counts.links, "link")]
                  .filter(Boolean)
                  .join(" · ")} — drag to reorder, click to edit.`
              : "Videos, documents and links people get when they open this resource."
          }
          actions={
            attachments.length > 0 ? (
              <Button icon={Plus} onClick={() => setAdding(true)}>
                Add attachment
              </Button>
            ) : undefined
          }
          className="mb-4"
        />
      </div>

      {attachments.length === 0 ? (
        <div className="px-5 pb-6 sm:px-6">
          <EmptyState
            icon={Paperclip}
            compact
            title="Nothing attached yet"
            description="Add at least one video, document or link before publishing."
            action={
              <Button icon={Plus} onClick={() => setAdding(true)}>
                Add the first attachment
              </Button>
            }
          />
        </div>
      ) : (
        <div className={cn("border-t border-slate-100 px-2 py-2 dark:border-ink-line sm:px-3", saving && "pointer-events-none opacity-70")}>
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
            <SortableContext items={attachments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {attachments.map((a, i) => (
                  <AttachmentRow key={a.id} attachment={a} index={i} onOpen={() => setOpenId(a.id)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 dark:border-ink-line dark:text-slate-400 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/5 dark:hover:text-brand-300"
          >
            <Plus className="h-4 w-4" /> Add attachment
          </button>
        </div>
      )}

      <AddAttachmentDialog open={adding} onClose={() => setAdding(false)} onCreated={setOpenId} />
      {open && <AttachmentSheet key={open.id} attachment={open} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </Card>
  );
}
