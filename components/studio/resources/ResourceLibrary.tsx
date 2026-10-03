"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, Eye, LayoutGrid, List, Plus, RotateCcw, Search, SearchX, Shapes, X } from "lucide-react";
import { Button, ButtonLink, Callout, EmptyState, Input, PageHeader, Segmented, cn } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { Select } from "@/components/ui/select";
import { deleteResource, listManagedResources } from "@/lib/api/resources-client";
import type { PaginatedResult, Resource, ResourceCategory, ResourceVisibility } from "@/lib/api/resources.types";
import { resourceKeys } from "./ResourceEditorContext";
import { ResourceCard, ResourceCardSkeleton, type ResourceView } from "./ResourceCard";
import { RESOURCE_CATEGORIES, RESOURCE_ICON, VISIBILITY_META } from "./resourceMeta";

type StatusFilter = "all" | "published" | "draft";

const PAGE_SIZE = 24;
const VIEW_KEY = "studio.resources.view";

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* Grid/list preference, remembered per browser. */
const viewListeners = new Set<() => void>();
let sessionView: ResourceView | null = null;
function readStoredView(): ResourceView {
  if (sessionView) return sessionView;
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}
function storeView(v: ResourceView) {
  sessionView = v;
  try {
    window.localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* storage unavailable */
  }
  viewListeners.forEach((l) => l());
}
function useStoredView() {
  return useSyncExternalStore(
    (cb) => {
      viewListeners.add(cb);
      return () => viewListeners.delete(cb);
    },
    readStoredView,
    () => "grid" as ResourceView,
  );
}

export function ResourceLibrary({ initialData }: { initialData: PaginatedResult<Resource> | null }) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 350);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<ResourceCategory | "">("");
  const [visibility, setVisibility] = useState<ResourceVisibility | "">("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Resource | null>(null);
  const view = useStoredView();

  // Reset to page 1 whenever a server-side filter changes.
  const filterSig = `${search}|${status}|${category}`;
  const [lastSig, setLastSig] = useState(filterSig);
  if (filterSig !== lastSig) {
    setLastSig(filterSig);
    setPage(1);
  }

  const params = {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    category: category || undefined,
    is_published: status === "all" ? undefined : status === "published",
  };
  const isDefault = page === 1 && !search && !category && status === "all";

  const query = useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: () => listManagedResources(params),
    initialData: isDefault && initialData ? initialData : undefined,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  // Visibility isn't a server filter; narrow the current page client-side.
  const items = (query.data?.items ?? []).filter((r) => !visibility || r.visibility === visibility);
  const meta = query.data?.meta;
  const filtersActive = !!(searchInput || category || visibility || status !== "all");

  function clearFilters() {
    setSearchInput("");
    setCategory("");
    setVisibility("");
    setStatus("all");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteResource(toDelete.id);
      toast.success(`"${toDelete.name}" was deleted`);
      await queryClient.invalidateQueries({ queryKey: resourceKeys.all });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the resource");
      throw e;
    }
  }

  const newResource = (
    <ButtonLink href="/dashboard/resource-management/new" icon={Plus}>
      New resource
    </ButtonLink>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Content"
        title="Resource management"
        description="Guides, templates, recordings and links for practitioners. Publish a resource to make it visible to the audience you choose."
        actions={newResource}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Input
              type="search"
              aria-label="Search resources"
              placeholder="Search resources by name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leading={<Search className="h-4 w-4" strokeWidth={2} />}
              className="pr-9"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
                className="absolute inset-y-0 right-2 my-auto grid h-6 w-6 cursor-pointer place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select
              aria-label="Filter by category"
              value={category}
              onChange={(v) => setCategory(v as ResourceCategory | "")}
              className="sm:w-56"
              icon={Shapes}
              menuWidth="auto"
              options={[{ value: "", label: "All categories", icon: Shapes }, ...RESOURCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))]}
            />
            <Select
              aria-label="Filter by visibility"
              value={visibility}
              onChange={(v) => setVisibility(v as ResourceVisibility | "")}
              className="sm:w-48"
              icon={Eye}
              menuWidth="auto"
              options={[
                { value: "", label: "Any visibility", icon: Eye },
                ...(Object.keys(VISIBILITY_META) as ResourceVisibility[]).map((v) => ({
                  value: v,
                  label: VISIBILITY_META[v].label,
                  icon: VISIBILITY_META[v].icon,
                  description: VISIBILITY_META[v].hint,
                })),
              ]}
            />
            <Segmented
              size="md"
              value={view}
              onChange={storeView}
              className="col-span-2 w-fit sm:col-span-1"
              options={[
                { key: "grid", label: <span className="sr-only">Grid view</span>, icon: LayoutGrid },
                { key: "list", label: <span className="sr-only">List view</span>, icon: List },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { key: "all", label: "All" },
              { key: "published", label: "Published" },
              { key: "draft", label: "Drafts" },
            ]}
          />
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {query.isFetching && !query.isLoading ? (
              <span>Updating…</span>
            ) : (
              <span>
                {visibility
                  ? `${items.length} shown on this page`
                  : `${meta?.total_items ?? items.length} resource${(meta?.total_items ?? items.length) === 1 ? "" : "s"}`}
              </span>
            )}
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="cursor-pointer font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {query.isError && !query.data ? (
        <Callout
          tone="danger"
          icon={AlertTriangle}
          title="We couldn't load resources"
          actions={
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => query.refetch()} loading={query.isFetching}>
              Try again
            </Button>
          }
        >
          {query.error instanceof Error ? query.error.message : "Please check your connection and try again."}
        </Callout>
      ) : query.isLoading ? (
        <Grid view={view}>
          {Array.from({ length: view === "grid" ? 6 : 5 }).map((_, i) => (
            <ResourceCardSkeleton key={i} view={view} />
          ))}
        </Grid>
      ) : items.length === 0 && !filtersActive ? (
        <EmptyState
          icon={RESOURCE_ICON}
          title="No resources yet"
          description="Share a guide, a template, a recorded webinar or a useful link. You can attach files after you create it."
          action={
            <ButtonLink href="/dashboard/resource-management/new" icon={Plus} size="lg">
              Create the first resource
            </ButtonLink>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          compact
          title="No resources match"
          description="Try a different search or clear the filters."
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className={cn("transition-opacity", query.isPlaceholderData && "opacity-60")}>
          <Grid view={view}>
            {items.map((r) => (
              <ResourceCard key={r.id} resource={r} view={view} onDelete={setToDelete} />
            ))}
          </Grid>
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {meta.page} of {meta.total_pages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={ArrowLeft} disabled={!meta.has_previous} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" iconRight={ArrowRight} disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this resource?"
        description={
          toDelete ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">“{toDelete.name}”</span> and all of its attachments will be
              removed{toDelete.is_published ? ", and it disappears for everyone who can currently see it" : ""}. This can&apos;t be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete resource"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Grid({ view, children }: { view: ResourceView; children: React.ReactNode }) {
  return <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2.5"}>{children}</div>;
}
