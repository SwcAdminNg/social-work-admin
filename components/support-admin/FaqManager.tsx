"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import {
  createFaqCategory,
  createFaqItem,
  deleteFaqCategory,
  deleteFaqItem,
  updateFaqCategory,
  updateFaqItem,
} from "@/lib/api/support-client";
import type { FaqCategory, FaqItem } from "@/lib/api/support.types";
import type { PaginatedResult } from "@/lib/api/courses.types";
import {
  IconMessageQuestion,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconSpinner,
} from "@/components/dashboard/icons";
import { Modal } from "@/components/generic/ui/Modal";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface FaqManagerProps {
  initialCategories: FaqCategory[];
  initialItems: PaginatedResult<FaqItem>;
}

type CategoryModalState = { open: boolean; category: FaqCategory | null };
type ItemModalState = { open: boolean; item: FaqItem | null };
type DeleteState = { open: boolean; type: "category" | "item"; id: string; label: string } | null;

export function FaqManager({ initialCategories, initialItems }: FaqManagerProps) {
  const [categories, setCategories] = useState<FaqCategory[]>(
    [...initialCategories].sort((a, b) => a.order - b.order)
  );
  const [items, setItems] = useState<FaqItem[]>(initialItems.items);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all");

  const [categoryModal, setCategoryModal] = useState<CategoryModalState>({ open: false, category: null });
  const [itemModal, setItemModal] = useState<ItemModalState>({ open: false, item: null });
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredItems = useMemo(() => {
    const base = selectedCategoryId === "all" ? items : items.filter((i) => i.category_id === selectedCategoryId);
    return [...base].sort((a, b) => a.order - b.order);
  }, [items, selectedCategoryId]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown category";

  function handleDeleteConfirm() {
    if (!deleteState) return;
    setDeleting(true);
    const run = deleteState.type === "category" ? deleteFaqCategory(deleteState.id) : deleteFaqItem(deleteState.id);
    run
      .then(() => {
        if (deleteState.type === "category") {
          setCategories((prev) => prev.filter((c) => c.id !== deleteState.id));
          if (selectedCategoryId === deleteState.id) setSelectedCategoryId("all");
        } else {
          setItems((prev) => prev.filter((i) => i.id !== deleteState.id));
        }
        toast.success(`${deleteState.type === "category" ? "Category" : "Question"} deleted.`);
        setDeleteState(null);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete."))
      .finally(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">FAQ Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize the public help center into categories and questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Categories</h2>
            <button
              type="button"
              onClick={() => setCategoryModal({ open: true, category: null })}
              className="p-1.5 rounded-lg text-[#2D6A4F] dark:text-[#52b788] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Add category"
            >
              <IconPlus />
            </button>
          </div>
          <ul className="flex flex-col p-2 gap-0.5 list-none m-0">
            <li>
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors cursor-pointer ${
                  selectedCategoryId === "all"
                    ? "bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                All Questions
                <span className="text-xs text-gray-400">{items.length}</span>
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id} className="group">
                <div
                  className={`flex items-center gap-1 px-1 rounded-lg ${
                    selectedCategoryId === cat.id ? "bg-[#2D6A4F]/10 dark:bg-[#52b788]/15" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-1 min-w-0 flex items-center justify-between py-2 px-2 text-sm font-medium text-left cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? "text-[#2D6A4F] dark:text-[#52b788]"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {items.filter((i) => i.category_id === cat.id).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryModal({ open: true, category: cat })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity cursor-pointer flex-shrink-0"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <IconChevronDown className="rotate-[-90deg]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteState({ open: true, type: "category", id: cat.id, label: cat.name })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity cursor-pointer flex-shrink-0"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-gray-400">No categories yet.</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setItemModal({ open: true, item: null })}
              disabled={categories.length === 0}
              title={categories.length === 0 ? "Create a category first" : undefined}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconPlus />
              Add Question
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={IconMessageQuestion}
              title="No questions yet"
              description="Add a question to this category to get started."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredItems.map((item) => (
                <FaqItemCard
                  key={item.id}
                  item={item}
                  categoryLabel={selectedCategoryId === "all" ? categoryName(item.category_id) : undefined}
                  onEdit={() => setItemModal({ open: true, item })}
                  onDelete={() => setDeleteState({ open: true, type: "item", id: item.id, label: item.question })}
                  onTogglePublish={(next) => {
                    updateFaqItem(item.id, { is_published: next })
                      .then((updated) => {
                        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
                      })
                      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to update."));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryModal
        state={categoryModal}
        onClose={() => setCategoryModal({ open: false, category: null })}
        onSaved={(cat) => {
          setCategories((prev) => {
            const exists = prev.some((c) => c.id === cat.id);
            const next = exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
            return next.sort((a, b) => a.order - b.order);
          });
          setCategoryModal({ open: false, category: null });
        }}
      />

      <ItemModal
        state={itemModal}
        categories={categories}
        defaultCategoryId={selectedCategoryId !== "all" ? selectedCategoryId : undefined}
        onClose={() => setItemModal({ open: false, item: null })}
        onSaved={(item) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.id === item.id);
            return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
          });
          setItemModal({ open: false, item: null });
        }}
      />

      <ConfirmModal
        isOpen={!!deleteState?.open}
        onClose={() => setDeleteState(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteState?.type === "category" ? "Category" : "Question"}`}
        description={
          deleteState?.type === "category" ? (
            <>
              Delete <strong>{deleteState?.label}</strong>? Its questions will stop appearing on the public FAQ.
            </>
          ) : (
            <>
              Delete the question <strong>&ldquo;{deleteState?.label}&rdquo;</strong>? This can&apos;t be undone.
            </>
          )
        }
        confirmText="Delete"
        isLoading={deleting}
        isDestructive
      />
    </div>
  );
}

function FaqItemCard({
  item,
  categoryLabel,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  item: FaqItem;
  categoryLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: (next: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 flex items-start gap-2 text-left cursor-pointer"
        >
          <IconChevronDown className={`flex-shrink-0 mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.question}</p>
            {categoryLabel && (
              <span className="inline-block mt-1 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">
                {categoryLabel}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onTogglePublish(!item.is_published)}
            className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
              item.is_published
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {item.is_published ? "Published" : "Draft"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            aria-label="Delete question"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {expanded && (
        <p className="mt-3 pl-6 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
          {item.answer}
        </p>
      )}
    </div>
  );
}

function CategoryModal({
  state,
  onClose,
  onSaved,
}: {
  state: CategoryModalState;
  onClose: () => void;
  onSaved: (category: FaqCategory) => void;
}) {
  const [name, setName] = useState(state.category?.name ?? "");
  const [order, setOrder] = useState(state.category?.order ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(state.category?.name ?? "");
    setOrder(state.category?.order ?? 0);
  }, [state.category, state.open]);

  if (!state.open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    const run = state.category
      ? updateFaqCategory(state.category.id, { name: trimmed, order })
      : createFaqCategory({ name: trimmed, order });
    run
      .then((cat) => {
        toast.success(state.category ? "Category updated." : "Category created.");
        onSaved(cat);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to save category."))
      .finally(() => setSaving(false));
  };

  return (
    <Modal isOpen={state.open} onClose={onClose} title={state.category ? "Edit Category" : "New Category"} maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Billing & Payments"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <IconSpinner className="w-4 h-4" /> : null}
            {state.category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ItemModal({
  state,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: {
  state: ItemModalState;
  categories: FaqCategory[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSaved: (item: FaqItem) => void;
}) {
  const [categoryId, setCategoryId] = useState(state.item?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "");
  const [question, setQuestion] = useState(state.item?.question ?? "");
  const [answer, setAnswer] = useState(state.item?.answer ?? "");
  const [order, setOrder] = useState(state.item?.order ?? 0);
  const [isPublished, setIsPublished] = useState(state.item?.is_published ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategoryId(state.item?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? "");
    setQuestion(state.item?.question ?? "");
    setAnswer(state.item?.answer ?? "");
    setOrder(state.item?.order ?? 0);
    setIsPublished(state.item?.is_published ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.item, state.open]);

  if (!state.open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a || !categoryId) return;
    setSaving(true);
    const run = state.item
      ? updateFaqItem(state.item.id, { category_id: categoryId, question: q, answer: a, order, is_published: isPublished })
      : createFaqItem({ category_id: categoryId, question: q, answer: a, order, is_published: isPublished });
    run
      .then((item) => {
        toast.success(state.item ? "Question updated." : "Question created.");
        onSaved(item);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to save question."))
      .finally(() => setSaving(false));
  };

  return (
    <Modal isOpen={state.open} onClose={onClose} title={state.item ? "Edit Question" : "New Question"} maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I reset my password?"
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Write the answer shown to users..."
            className="w-full resize-y rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-[#2D6A4F] focus:ring-[#2D6A4F]"
            />
            Published
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !question.trim() || !answer.trim() || !categoryId}
            className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <IconSpinner className="w-4 h-4" /> : null}
            {state.item ? "Save Changes" : "Create Question"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
