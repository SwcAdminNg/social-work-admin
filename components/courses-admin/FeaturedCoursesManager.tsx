"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { getFeaturedCourses, setFeaturedCourses } from "@/lib/api/courses-client";
import { listManagedCourses } from "@/lib/api/courses-client";
import type { FeaturedCourse, Course, FeaturedCoursesResponse } from "@/lib/api/courses.types";
import {
  IconBookOpen,
  IconGripVertical,
  IconPlus,
  IconSparkles,
  IconSpinner,
  IconTrash,
  IconX,
} from "@/components/dashboard/icons";
import { categoryLabel, levelLabel } from "./constants";

interface FeaturedCoursesManagerProps {
  initialData: FeaturedCoursesResponse;
}

// ─── Drag helpers ────────────────────────────────────────────────────────────
function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function CourseThumbnail({ url, title }: { url: string | null; title: string }) {
  return (
    <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 dark:text-slate-600">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="w-full h-full object-cover" />
      ) : (
        <IconBookOpen />
      )}
    </div>
  );
}

interface FeaturedRowProps {
  course: FeaturedCourse;
  index: number;
  total: number;
  dragging: boolean;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
  onRemove: (id: string) => void;
}

function FeaturedRow({
  course,
  index,
  total,
  dragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
}: FeaturedRowProps) {
  return (
    <li
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 select-none
        ${dragging
          ? "border-brand-600/40 dark:border-brand-400/40 bg-brand-600/5 dark:bg-brand-400/5 shadow-lg"
          : "border-slate-200 dark:border-ink-line bg-white dark:bg-ink-surface hover:border-slate-300 dark:hover:border-slate-700"
        }`}
    >
      {/* Drag handle */}
      <span className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 flex-shrink-0 transition-colors">
        <IconGripVertical />
      </span>

      {/* Order badge */}
      <span className="w-6 h-6 rounded-full bg-brand-600/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </span>

      <CourseThumbnail url={course.thumbnail_url} title={course.title} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {course.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {categoryLabel(course.category)} · {levelLabel(course.level)}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
            course.is_published
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
          }`}
        >
          {course.is_published ? "Published" : "Draft"}
        </span>
        <button
          type="button"
          onClick={() => onRemove(course.id)}
          aria-label={`Remove ${course.title} from featured`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
        >
          <IconTrash />
        </button>
      </div>
    </li>
  );
}

// ─── Course Picker Modal ─────────────────────────────────────────────────────
interface CoursePickerProps {
  open: boolean;
  featuredIds: Set<string>;
  onAdd: (course: Course) => void;
  onClose: () => void;
}

function CoursePicker({ open, featuredIds, onAdd, onClose }: CoursePickerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await listManagedCourses({ page: 1, page_size: 50, is_published: true });
      setCourses(res.items);
      setLoaded(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  // Load courses when modal opens
  if (open && !loaded && !loading) {
    load();
  }

  const filtered = courses.filter(
    (c) =>
      !featuredIds.has(c.id) &&
      c.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-ink-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-ink-line flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-ink-line">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Add Course to Featured
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-ink-line">
          <input
            id="course-picker-search"
            type="text"
            autoComplete="off"

            placeholder="Search published courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/40 dark:focus:ring-brand-400/40 transition"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <IconSpinner className="w-6 h-6" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">
              {courses.length === 0 ? "No published courses found." : "No courses match your search."}
            </p>
          )}
          <ul className="flex flex-col gap-1.5 list-none m-0 p-0">
            {filtered.map((course) => (
              <li key={course.id}>
                <button
                  type="button"
                  onClick={() => { onAdd(course); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-brand-600/5 dark:hover:bg-brand-400/10 transition-colors cursor-pointer group"
                >
                  <CourseThumbnail url={course.thumbnail_url} title={course.title} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {course.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {categoryLabel(course.category)} · {levelLabel(course.level)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600/10 dark:bg-brand-400/15 text-brand-600 dark:text-brand-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconPlus />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function FeaturedCoursesManager({ initialData }: FeaturedCoursesManagerProps) {
  const [featured, setFeatured] = useState<FeaturedCourse[]>(initialData.items ?? []);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, startSave] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  const featuredIds = new Set(featured.map((c) => c.id));

  // ── Fetch fresh data from the public GET endpoint ──
  // Called on mount (bypasses stale RSC router-cache payloads) and after every save.
  const refetchFeatured = useCallback(async () => {
    try {
      const fresh = await getFeaturedCourses({ page: 1, limit: 50 });
      setFeatured(fresh.items ?? []);
    } catch {
      // Non-fatal: silently keep whatever we already have in state
    }
  }, []);

  useEffect(() => {
    refetchFeatured();
  }, [refetchFeatured]);

  // ── Drag-and-drop ──
  function handleDragStart(i: number) {
    setDragFrom(i);
  }

  function handleDragOver(i: number) {
    if (dragFrom === null || dragFrom === i) return;
    setFeatured((prev) => reorder(prev, dragFrom, i));
    setDragFrom(i);
    setIsDirty(true);
  }

  function handleDragEnd() {
    setDragFrom(null);
  }

  // ── Add course ──
  function handleAdd(course: Course) {
    const asFeatured: FeaturedCourse = {
      ...course,
      is_featured: true,
      featured_order: featured.length,
      is_enrolled: false,
      has_access: false,
    };
    setFeatured((prev) => [...prev, asFeatured]);
    setIsDirty(true);
    toast.success(`"${course.title}" added to featured.`);
  }

  // ── Remove course ──
  function handleRemove(id: string) {
    setFeatured((prev) => prev.filter((c) => c.id !== id));
    setIsDirty(true);
  }

  // ── Save ──
  function handleSave() {
    startSave(async () => {
      try {
        await setFeaturedCourses({ course_ids: featured.map((c) => c.id) });
        toast.success("Featured courses updated successfully.");
        setIsDirty(false);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to save featured courses.");
        return; // don't refetch if the save itself failed
      }
      // Always refetch after a successful save — separated from the PUT try/catch
      // so a GET failure doesn't roll back the success toast.
      await refetchFeatured();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Courses
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose which courses are highlighted on the homepage and control their display order.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              id="add-featured-course-btn"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-600/10 dark:bg-brand-400/15 hover:bg-brand-600/20 dark:hover:bg-brand-400/25 transition-all duration-200 cursor-pointer"
            >
              <IconPlus />
              Add Course
            </button>
            <button
              type="button"
              id="save-featured-courses-btn"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-green-900/20 transition-all duration-200 cursor-pointer
                ${!isDirty || saving
                  ? "bg-brand-600/40 dark:bg-brand-400/30 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700"
                }`}
            >
              {saving ? <IconSpinner className="w-4 h-4" /> : null}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <span className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0">
            <IconSparkles />
          </span>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Drag rows to reorder. The order here is the exact order shown to visitors.
            Saving overwrites the current featured list on the platform.
          </p>
        </div>

        {/* Featured list */}
        <div className="rounded-2xl bg-white dark:bg-ink-surface border border-slate-200 dark:border-ink-line overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-ink-line flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Currently Featured
            </h2>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">
              {featured.length} course{featured.length !== 1 ? "s" : ""}
            </span>
          </div>

          {featured.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <IconSparkles />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  No featured courses yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click "Add Course" to select courses to feature on the homepage.
                </p>
              </div>
            </div>
          ) : (
            <ul
              className="flex flex-col gap-2 p-4 list-none m-0"
              aria-label="Featured courses list"
            >
              {featured.map((course, index) => (
                <FeaturedRow
                  key={course.id}
                  course={course}
                  index={index}
                  total={featured.length}
                  dragging={dragFrom === index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Unsaved changes indicator */}
        {isDirty && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You have unsaved changes. Click{" "}
              <strong className="font-semibold">Save Changes</strong> to apply them.
            </p>
          </div>
        )}
      </div>

      <CoursePicker
        open={pickerOpen}
        featuredIds={featuredIds}
        onAdd={handleAdd}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
