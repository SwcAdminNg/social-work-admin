"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderTree, Layers, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { createCatalog, deleteCatalog, getCatalogs, updateCatalog } from "@/lib/api/courses-client";
import type { CourseCatalog, CourseCategory } from "@/lib/api/courses.types";
import { Badge, Button, Callout, EmptyState, Input, PageHeader, StatCard, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Menu } from "@/components/ui/overlays";
import { CATEGORY_OPTIONS, categoryLabel } from "./constants";
import { CatalogEditorSheet, type CatalogFormValues } from "./catalogs/CatalogEditorSheet";
import { CatalogIcon } from "./catalogs/catalog-icons";

interface CourseCatalogsManagerProps {
  initialData: CourseCatalog[];
}

type EditorState = { open: boolean; catalog: CourseCatalog | null; preset?: CourseCategory[]; nonce: number };

const MAX_CHIPS = 4;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError || err instanceof Error ? err.message || fallback : fallback;
}

export function CourseCatalogsManager({ initialData }: CourseCatalogsManagerProps) {
  const [catalogs, setCatalogs] = useState<CourseCatalog[]>(initialData);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState>({ open: false, catalog: null, nonce: 0 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CourseCatalog | null>(null);

  const refetch = useCallback(async () => {
    try {
      setCatalogs(await getCatalogs());
    } catch {
      // The list we already have is still valid; a failed refresh isn't worth interrupting for.
    }
  }, []);

  const covered = useMemo(() => new Set(catalogs.flatMap((c) => c.categories)), [catalogs]);
  const uncovered = useMemo(() => CATEGORY_OPTIONS.filter((o) => !covered.has(o.value)), [covered]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogs;
    return catalogs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.categories.some((cat) => categoryLabel(cat).toLowerCase().includes(q)),
    );
  }, [catalogs, query]);

  function openCreate(preset?: CourseCategory[]) {
    setEditor((e) => ({ open: true, catalog: null, preset, nonce: e.nonce + 1 }));
  }

  function openEdit(catalog: CourseCatalog) {
    setEditor((e) => ({ open: true, catalog, nonce: e.nonce + 1 }));
  }

  async function handleSave(values: CatalogFormValues) {
    setSaving(true);
    try {
      if (editor.catalog) {
        await updateCatalog(editor.catalog.id, {
          name: values.name,
          description: values.description,
          icon_name: values.icon_name,
          categories: values.categories,
        });
        toast.success(`“${values.name}” updated.`);
      } else {
        await createCatalog({
          name: values.name,
          categories: values.categories,
          icon_name: values.icon_name || undefined,
          description: values.description || undefined,
        });
        toast.success(`“${values.name}” created.`);
      }
      setEditor((e) => ({ ...e, open: false }));
      await refetch();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the catalog. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(catalog: CourseCatalog) {
    try {
      await deleteCatalog(catalog.id);
      setCatalogs((prev) => prev.filter((c) => c.id !== catalog.id));
      setEditor((e) => (e.catalog?.id === catalog.id ? { ...e, open: false } : e));
      toast.success(`“${catalog.name}” deleted. No courses were removed.`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the catalog. Please try again."));
      throw err; // keep the confirmation open
    }
  }

  const hasCatalogs = catalogs.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Learning catalogue"
        title="Course catalogs"
        description="Group categories into collections learners can browse on the student site. A catalog only organises courses — editing or deleting one never changes the courses themselves."
        actions={
          <Button icon={Plus} onClick={() => openCreate()}>
            New catalog
          </Button>
        }
      />

      {hasCatalogs && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Catalogs"
            value={catalogs.length}
            icon={FolderTree}
            hint={`${catalogs.reduce((n, c) => n + (c.total_courses ?? 0), 0)} course listings across all catalogs`}
          />
          <StatCard
            label="Categories covered"
            value={
              <>
                {covered.size}
                <span className="text-base font-bold text-slate-400"> / {CATEGORY_OPTIONS.length}</span>
              </>
            }
            icon={Layers}
            tone={uncovered.length ? "warning" : "success"}
            hint={uncovered.length ? `${uncovered.length} not in any catalog yet` : "Every category is in a catalog"}
          />
        </div>
      )}

      {hasCatalogs && uncovered.length > 0 && (
        <Callout
          tone="warning"
          icon={Sparkles}
          title="Some categories aren’t in any catalog"
          actions={
            <Button size="sm" variant="outline" onClick={() => openCreate(uncovered.map((o) => o.value))}>
              Create a catalog for these
            </Button>
          }
        >
          Courses in these categories won’t appear under a catalog on the student site:{" "}
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {uncovered.map((o) => o.label).join(", ")}
          </span>
          .
        </Callout>
      )}

      {hasCatalogs && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <Input
              type="search"
              aria-label="Search catalogs"
              placeholder="Search catalogs or categories"
              leading={<Search className="h-4 w-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
            {query.trim() ? `${visible.length} of ${catalogs.length} catalogs` : `${catalogs.length} catalogs`}
          </p>
        </div>
      )}

      {!hasCatalogs ? (
        <EmptyState
          icon={FolderTree}
          title="Create your first catalog"
          description="Catalogs group categories — for example “Child protection” or “Practice skills” — so learners can find related courses together."
          action={
            <Button icon={Plus} onClick={() => openCreate()}>
              New catalog
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          icon={Search}
          title={`No catalogs match “${query.trim()}”`}
          description="Try a different name or category."
          action={
            <Button variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((catalog) => (
            <li key={catalog.id}>
              <CatalogCard
                catalog={catalog}
                onEdit={() => openEdit(catalog)}
                onDelete={() => setDeleting(catalog)}
              />
            </li>
          ))}
        </ul>
      )}

      <CatalogEditorSheet
        key={editor.nonce}
        open={editor.open}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        catalog={editor.catalog}
        presetCategories={editor.preset}
        allCatalogs={catalogs}
        saving={saving}
        onSave={handleSave}
        onDelete={editor.catalog ? () => setDeleting(editor.catalog) : undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete “${deleting.name}”?` : "Delete catalog?"}
        description="This removes the catalog from the student site. It can’t be undone."
        confirmLabel="Delete catalog"
        onConfirm={async () => {
          if (deleting) await handleDelete(deleting);
        }}
      >
        {deleting && (
          <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-white">No courses are deleted.</strong>{" "}
                {deleting.total_courses ?? 0} published course{(deleting.total_courses ?? 0) === 1 ? "" : "s"} in its{" "}
                {deleting.categories.length} categor{deleting.categories.length === 1 ? "y" : "ies"} stay available.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" aria-hidden />
              <span>Learners will no longer find them grouped under this catalog, and links to it will stop working.</span>
            </li>
          </ul>
        )}
      </ConfirmDialog>
    </div>
  );
}

function CatalogCard({
  catalog,
  onEdit,
  onDelete,
}: {
  catalog: CourseCatalog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const courses = catalog.total_courses ?? 0;
  const shown = catalog.categories.slice(0, MAX_CHIPS);
  const extra = catalog.categories.length - shown.length;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)]",
        "dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-200/60 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20">
          <CatalogIcon name={catalog.icon_name} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          {/* The title is the card's primary action; its hit area stretches over the card. */}
          <button
            type="button"
            onClick={onEdit}
            className="block w-full cursor-pointer truncate text-left font-display text-base font-bold text-slate-900 outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-brand-400/60 dark:text-white"
          >
            {catalog.name}
          </button>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {courses} published course{courses === 1 ? "" : "s"}
          </p>
        </div>
        <div className="relative z-10 -mr-1.5 -mt-1">
          <Menu
            trigger={
              <Button variant="ghost" size="sm" iconOnly icon={MoreHorizontal} aria-label={`Actions for ${catalog.name}`} />
            }
            items={[
              { label: "Edit", icon: Pencil, onSelect: onEdit },
              "separator",
              { label: "Delete…", icon: Trash2, onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>

      <p
        className={cn(
          "mt-3.5 line-clamp-2 min-h-[2.75rem] text-sm leading-[1.4rem]",
          catalog.description ? "text-slate-600 dark:text-slate-300" : "italic text-slate-400 dark:text-slate-500",
        )}
      >
        {catalog.description || "No description yet."}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {shown.map((cat) => (
          <Badge key={cat} tone="neutral" size="xs">
            {categoryLabel(cat)}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge tone="brand" size="xs" title={catalog.categories.slice(MAX_CHIPS).map(categoryLabel).join(", ")}>
            +{extra} more
          </Badge>
        )}
      </div>
    </article>
  );
}
