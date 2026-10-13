"use client";

import { useMemo, useState } from "react";
import { Check, Info, Trash2 } from "lucide-react";
import { Badge, Button, Callout, Field, Input, Textarea, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import type { CourseCatalog, CourseCategory } from "@/lib/api/courses.types";
import { CATEGORY_OPTIONS } from "../constants";
import { CATALOG_ICONS, CatalogIcon, isKnownCatalogIcon } from "./catalog-icons";

export type CatalogFormValues = {
  name: string;
  description: string;
  icon_name: string;
  categories: CourseCategory[];
};

const DESCRIPTION_MAX = 240;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new catalog. */
  catalog: CourseCatalog | null;
  /** Used to warn about categories that are already placed in another catalog. */
  allCatalogs: CourseCatalog[];
  /** Pre-selected categories when creating (e.g. from the "not in any catalog" prompt). */
  presetCategories?: CourseCategory[];
  saving: boolean;
  onSave: (values: CatalogFormValues) => Promise<void> | void;
  onDelete?: () => void;
};

function initialValues(catalog: CourseCatalog | null, preset: CourseCategory[] = []): CatalogFormValues {
  return {
    name: catalog?.name ?? "",
    description: catalog?.description ?? "",
    icon_name: catalog?.icon_name ?? "",
    categories: catalog ? [...catalog.categories] : [...preset],
  };
}

export function CatalogEditorSheet({
  open,
  onOpenChange,
  catalog,
  allCatalogs,
  presetCategories,
  saving,
  onSave,
  onDelete,
}: Props) {
  const isEdit = !!catalog;
  const [values, setValues] = useState<CatalogFormValues>(() => initialValues(catalog, presetCategories));
  const [touched, setTouched] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const baseline = useMemo(() => initialValues(catalog, presetCategories), [catalog, presetCategories]);
  const dirty =
    values.name !== baseline.name ||
    values.description !== baseline.description ||
    values.icon_name !== baseline.icon_name ||
    values.categories.length !== baseline.categories.length ||
    values.categories.some((c) => !baseline.categories.includes(c));

  const nameTrimmed = values.name.trim();
  const duplicate = allCatalogs.some(
    (c) => c.id !== catalog?.id && c.name.trim().toLowerCase() === nameTrimmed.toLowerCase(),
  );
  const nameError = !nameTrimmed ? "Give the catalog a name." : duplicate ? "A catalog with this name already exists." : null;
  const categoriesError = values.categories.length === 0 ? "Choose at least one category." : null;
  const valid = !nameError && !categoriesError;

  const otherCatalogsByCategory = useMemo(() => {
    const map = new Map<CourseCategory, string[]>();
    for (const c of allCatalogs) {
      if (c.id === catalog?.id) continue;
      for (const cat of c.categories) map.set(cat, [...(map.get(cat) ?? []), c.name]);
    }
    return map;
  }, [allCatalogs, catalog?.id]);

  const legacyIcon = !!values.icon_name && !isKnownCatalogIcon(values.icon_name);

  function set<K extends keyof CatalogFormValues>(key: K, value: CatalogFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleCategory(cat: CourseCategory) {
    setValues((v) => ({
      ...v,
      categories: v.categories.includes(cat) ? v.categories.filter((c) => c !== cat) : [...v.categories, cat],
    }));
  }

  function requestClose(next: boolean) {
    if (!next && dirty && !saving) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(next);
  }

  async function submit() {
    setTouched(true);
    if (!valid) return;
    await onSave({ ...values, name: nameTrimmed, description: values.description.trim() });
  }

  const allSelected = values.categories.length === CATEGORY_OPTIONS.length;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={requestClose}
        width="max-w-xl"
        title={isEdit ? "Edit catalog" : "New catalog"}
        description={
          isEdit
            ? "Changes appear on the student site straight away."
            : "Group categories into one collection learners can browse."
        }
        footer={
          <>
            {isEdit && onDelete && (
              <Button variant="soft-danger" icon={Trash2} onClick={onDelete} disabled={saving} className="mr-auto">
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => requestClose(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving} disabled={isEdit ? !dirty : false}>
              {isEdit ? "Save changes" : "Create catalog"}
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {/* Live preview - what the card looks like to learners */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-ink-line dark:bg-ink-surface">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Preview</p>
            <div className="flex items-start gap-3.5">
              <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-200/60 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20">
                <CatalogIcon name={values.icon_name} className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className={cn("font-display text-base font-bold", nameTrimmed ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600")}>
                  {nameTrimmed || "Catalog name"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {values.description.trim() || "A short description appears here."}
                </p>
              </div>
            </div>
          </div>

          <Field label="Name" htmlFor="catalog-name" required error={touched ? nameError : duplicate ? nameError : null}>
            <Input
              id="catalog-name"
              value={values.name}
              maxLength={255}
              autoFocus={!isEdit}
              placeholder="e.g. Child protection & safeguarding"
              invalid={touched && !!nameError}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="catalog-desc"
            optional
            aside={<span className="text-xs tabular-nums text-slate-400">{values.description.length}/{DESCRIPTION_MAX}</span>}
          >
            <Textarea
              id="catalog-desc"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={values.description}
              placeholder="One or two sentences that tell learners what they will find here."
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <Field label="Icon" optional hint="Shown on the student site. Pick the one that best fits the collection.">
            {legacyIcon && (
              <Callout tone="warning" icon={Info} className="mb-2">
                This catalog uses the icon name “{values.icon_name}”, which the student site can’t display, so it shows
                a book. Choose an icon below to fix that.
              </Callout>
            )}
            <div role="radiogroup" aria-label="Icon" className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {CATALOG_ICONS.map(({ name, label, icon: Icon }) => {
                const selected = values.icon_name === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={label}
                    title={label}
                    onClick={() => set("icon_name", selected ? "" : name)}
                    className={cn(
                      "grid aspect-square cursor-pointer place-items-center rounded-xl border transition-all duration-150 active:scale-95",
                      selected
                        ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/25 dark:border-brand-400 dark:bg-brand-400/15 dark:text-brand-200"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-ink-line dark:bg-ink-surface dark:text-slate-400 dark:hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="Categories"
            required
            error={touched ? categoriesError : null}
            hint="Courses in these categories are listed under this catalog."
            aside={
              <button
                type="button"
                className="cursor-pointer text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
                onClick={() => set("categories", allSelected ? [] : CATEGORY_OPTIONS.map((o) => o.value))}
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            }
          >
            <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
              {CATEGORY_OPTIONS.map((opt) => {
                const selected = values.categories.includes(opt.value);
                const elsewhere = otherCatalogsByCategory.get(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={selected}
                    title={elsewhere ? `Also in: ${elsewhere.join(", ")}` : undefined}
                    onClick={() => toggleCategory(opt.value)}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.97]",
                      selected
                        ? "border-brand-600 bg-brand-600 text-white shadow-[0_6px_16px_-10px_rgba(45,106,79,0.9)] dark:border-brand-400 dark:bg-brand-400 dark:text-[#06130d]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:bg-ink-surface dark:text-slate-200 dark:hover:bg-white/5",
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    {opt.label}
                    {elsewhere && !selected && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Badge tone={values.categories.length ? "brand" : "neutral"} size="xs">
                {values.categories.length} selected
              </Badge>
              {[...otherCatalogsByCategory.keys()].some((c) => values.categories.includes(c)) && (
                <span>
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" aria-hidden />
                  Some categories also appear in other catalogs. That’s fine — hover to see which.
                </span>
              )}
            </p>
          </Field>
        </form>
      </Sheet>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        tone="warning"
        title="Discard your changes?"
        description="You have unsaved changes to this catalog."
        confirmLabel="Discard changes"
        onConfirm={() => {
          onOpenChange(false);
        }}
      />
    </>
  );
}
