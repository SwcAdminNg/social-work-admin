"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getLiveSessionRecordingUrl, updateItem } from "@/lib/api/courses-client";
import type { CourseItem, CourseLiveSession } from "@/lib/api/courses.types";
import { ConfirmDialog } from "./ConfirmDialog";
import { VideoStatusBadge } from "./StatusBadge";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LiveSessionEditor({
  courseId,
  item,
  onLiveSessionUpdate,
}: {
  courseId: string;
  item: CourseItem;
  onLiveSessionUpdate: (liveSession: CourseLiveSession) => void;
}) {
  const liveSession = item.live_session;
  const editable = liveSession?.status === "SCHEDULED";
  const [fetchingRecording, setFetchingRecording] = useState(false);

  const [scheduledStartAt, setScheduledStartAt] = useState(
    liveSession ? toLocalInputValue(liveSession.scheduled_start_at) : "",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    liveSession ? String(liveSession.duration_minutes) : "60",
  );
  const [guestName, setGuestName] = useState(liveSession?.guest_name ?? "");
  const [guestTitle, setGuestTitle] = useState(liveSession?.guest_title ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmReschedule, setConfirmReschedule] = useState(false);

  if (!liveSession) return null;

  const scheduleChanged =
    scheduledStartAt !== toLocalInputValue(liveSession.scheduled_start_at);
  const durationChanged = durationMinutes.trim() !== String(liveSession.duration_minutes);
  const guestNameChanged = guestName.trim() !== (liveSession.guest_name ?? "");
  const guestTitleChanged = guestTitle.trim() !== (liveSession.guest_title ?? "");
  const dirty = scheduleChanged || durationChanged || guestNameChanged || guestTitleChanged;

  async function persist() {
    setSaving(true);
    try {
      const fields: Parameters<typeof updateItem>[1] = {};
      if (scheduleChanged) {
        fields.scheduled_start_at = new Date(scheduledStartAt).toISOString();
      }
      if (durationChanged) {
        const parsed = parseInt(durationMinutes, 10);
        fields.duration_minutes = !isNaN(parsed) ? parsed : liveSession!.duration_minutes;
      }
      if (guestNameChanged) {
        fields.guest_name = guestName.trim() || null;
      }
      if (guestTitleChanged) {
        fields.guest_title = guestTitle.trim() || null;
      }

      await updateItem(item.id, fields);

      const next: CourseLiveSession = {
        ...liveSession!,
        scheduled_start_at: fields.scheduled_start_at ?? liveSession!.scheduled_start_at,
        duration_minutes: fields.duration_minutes ?? liveSession!.duration_minutes,
        guest_name: guestNameChanged ? (guestName.trim() || null) : liveSession!.guest_name,
        guest_title: guestTitleChanged ? (guestTitle.trim() || null) : liveSession!.guest_title,
      };
      onLiveSessionUpdate(next);
      toast.success(
        scheduleChanged
          ? "Session rescheduled — enrolled students have been notified."
          : "Session updated.",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update live session.");
    } finally {
      setSaving(false);
      setConfirmReschedule(false);
    }
  }

  function handleSaveClick() {
    if (scheduleChanged) {
      setConfirmReschedule(true);
    } else {
      persist();
    }
  }

  async function handleViewRecording() {
    // Open the tab synchronously (within the click's user-gesture window) and
    // point it at the signed URL once fetched — awaiting first would risk the
    // browser's popup blocker treating window.open as no longer gesture-initiated.
    const tab = window.open("", "_blank", "noopener,noreferrer");
    setFetchingRecording(true);
    try {
      const url = await getLiveSessionRecordingUrl(courseId, item.id);
      if (!url) {
        tab?.close();
        toast.error("No recording link is available yet.");
        return;
      }
      if (tab) tab.location.href = url;
    } catch (error) {
      tab?.close();
      toast.error(error instanceof ApiError ? error.message : "Failed to fetch the recording link.");
    } finally {
      setFetchingRecording(false);
    }
  }

  return (
    <div className="space-y-3">
      {!editable && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-2">
          This session is {liveSession.status.toLowerCase()} and can no longer be edited.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Date &amp; time
          </label>
          <input
            type="datetime-local"
            value={scheduledStartAt}
            disabled={!editable}
            onChange={(e) => setScheduledStartAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Duration (minutes)
          </label>
          <input
            type="number"
            min={5}
            max={600}
            value={durationMinutes}
            disabled={!editable}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Guest name (optional)
          </label>
          <input
            type="text"
            maxLength={255}
            value={guestName}
            disabled={!editable}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Dr. Amara Okafor"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Guest title (optional)
          </label>
          <input
            type="text"
            maxLength={255}
            value={guestTitle}
            disabled={!editable}
            onChange={(e) => setGuestTitle(e.target.value)}
            placeholder="e.g. Clinical Director, Crisis Response Network"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {editable && scheduleChanged && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          Changing the date/time will immediately re-notify every enrolled student with a rescheduled email.
        </p>
      )}

      {editable && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={!dirty || saving}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}

      {(liveSession.recording_status || liveSession.status === "ENDED") && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recording:</span>
          {liveSession.recording_status ? (
            <VideoStatusBadge status={liveSession.recording_status} />
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-600">Not available yet</span>
          )}
          {liveSession.recording_status === "READY" && (
            <button
              type="button"
              onClick={handleViewRecording}
              disabled={fetchingRecording}
              className="text-xs font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {fetchingRecording ? "Fetching link..." : "View recording"}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmReschedule}
        title="Reschedule this session?"
        description="Every enrolled student will immediately receive a rescheduled email with the old and new times and an updated calendar invite. This isn't a silent save."
        confirmLabel="Reschedule and notify"
        destructive={false}
        loading={saving}
        onConfirm={persist}
        onCancel={() => setConfirmReschedule(false)}
      />
    </div>
  );
}
