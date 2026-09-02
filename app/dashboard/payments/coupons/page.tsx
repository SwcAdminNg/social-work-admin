"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/lib/api/coupons-client";
import { CouponReadDTO, CreateCouponPayload } from "@/lib/api/coupons.types";
import { listManagedCourses } from "@/lib/api/courses-client";
import { CATEGORY_OPTIONS } from "@/components/courses-admin/constants";
import { IconPlus, IconTrash, IconSpinner, IconHash, IconX } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import * as Dialog from "@radix-ui/react-dialog";

const inputClass =
  "rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none disabled:opacity-50";
const labelClass = "text-sm font-bold text-gray-700 dark:text-gray-300";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function formatMoney(n: number): string {
  return `₦${n.toLocaleString()}`;
}

interface FormState {
  code: string;
  description: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  discount_value: string;
  max_discount_amount: string;
  min_order_amount: string;
  valid_from: string;
  valid_until: string;
  max_redemptions: string;
  max_redemptions_per_user: string;
  applicable_course_ids: string[];
  applicable_category: string;
  new_users_only: boolean;
  is_active: boolean;
}

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "PERCENTAGE",
  discount_value: "",
  max_discount_amount: "",
  min_order_amount: "",
  valid_from: "",
  valid_until: "",
  max_redemptions: "",
  max_redemptions_per_user: "1",
  applicable_course_ids: [],
  applicable_category: "",
  new_users_only: false,
  is_active: true,
};

function couponToForm(c: CouponReadDTO): FormState {
  return {
    code: c.code,
    description: c.description ?? "",
    discount_type: c.discount_type,
    discount_value: String(c.discount_value),
    max_discount_amount: c.max_discount_amount != null ? String(c.max_discount_amount) : "",
    min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : "",
    valid_from: toDatetimeLocal(c.valid_from),
    valid_until: toDatetimeLocal(c.valid_until),
    max_redemptions: c.max_redemptions != null ? String(c.max_redemptions) : "",
    max_redemptions_per_user: String(c.max_redemptions_per_user),
    applicable_course_ids: c.applicable_course_ids ?? [],
    applicable_category: c.applicable_category ?? "",
    new_users_only: c.new_users_only,
    is_active: c.is_active,
  };
}

function formToPayload(form: FormState): CreateCouponPayload {
  return {
    code: form.code.trim(),
    description: form.description.trim() || null,
    discount_type: form.discount_type,
    discount_value: parseFloat(form.discount_value),
    max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
    min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
    valid_from: fromDatetimeLocal(form.valid_from),
    valid_until: fromDatetimeLocal(form.valid_until),
    max_redemptions: form.max_redemptions ? parseInt(form.max_redemptions, 10) : null,
    max_redemptions_per_user: parseInt(form.max_redemptions_per_user, 10) || 1,
    applicable_course_ids: form.applicable_course_ids.length ? form.applicable_course_ids : null,
    applicable_category: (form.applicable_category || null) as CreateCouponPayload["applicable_category"],
    new_users_only: form.new_users_only,
    is_active: form.is_active,
  };
}

function CourseScopePicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const { data } = useQuery({
    queryKey: ["managed_courses_search", search],
    queryFn: () => listManagedCourses({ search: search || undefined, page: 1, page_size: 10 }),
  });
  const { data: selectedCourses } = useQuery({
    queryKey: ["managed_courses_search", ""],
    queryFn: () => listManagedCourses({ page: 1, page_size: 50 }),
  });

  const titleFor = (id: string) =>
    data?.items.find((c) => c.id === id)?.title ??
    selectedCourses?.items.find((c) => c.id === id)?.title ??
    id;

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Search courses to scope this coupon to…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={inputClass}
      />
      {search && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {data?.items.length ? (
            data.items.map((course) => (
              <button
                type="button"
                key={course.id}
                onClick={() => {
                  if (!selectedIds.includes(course.id)) onChange([...selectedIds, course.id]);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {course.title}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-400">No courses found</div>
          )}
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]"
            >
              {titleFor(id)}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                className="hover:opacity-70"
                aria-label="Remove course"
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CouponsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["coupons", page],
    queryFn: () => getCoupons(page, 20),
    enabled: !!session,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<CouponReadDTO | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = React.useState<CouponReadDTO | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["coupons"] });

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      toast.success("Coupon created successfully");
      invalidate();
      closeModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create coupon"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateCouponPayload> }) =>
      updateCoupon(id, payload),
    onSuccess: () => {
      toast.success("Coupon updated successfully");
      invalidate();
      closeModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update coupon"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      toast.success("Coupon deleted");
      invalidate();
      setDeleteConfirmCoupon(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete coupon"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateCoupon(id, { is_active }),
    onSuccess: () => {
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update coupon"),
  });

  function openModal(coupon?: CouponReadDTO) {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm(couponToForm(coupon));
    } else {
      setEditingCoupon(null);
      setForm(emptyForm);
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = formToPayload(form);
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
        Failed to fetch coupons. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Coupons</h2>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors shadow-sm"
        >
          <IconPlus /> Create Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <IconSpinner className="text-[#2D6A4F]" />
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={IconHash}
          title="No coupons yet"
          description="Create your first discount code to run a promo."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Redemptions</th>
                <th className="px-4 py-3">Valid window</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.items.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-white">{coupon.code}</div>
                    {coupon.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {coupon.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {coupon.discount_type === "PERCENTAGE"
                      ? `${coupon.discount_value}%${coupon.max_discount_amount ? ` (up to ${formatMoney(coupon.max_discount_amount)})` : ""}`
                      : formatMoney(coupon.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {coupon.times_redeemed}
                    {coupon.max_redemptions != null ? ` / ${coupon.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : "—"}
                    {" → "}
                    {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: coupon.id, is_active: !coupon.is_active })
                      }
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                        coupon.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openModal(coupon)}
                      className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCoupon(coupon)}
                      className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label="Delete coupon"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex justify-end items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {data.page} of {data.total_pages}
          </span>
          <button
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl z-50 p-6 border border-gray-200 dark:border-gray-800">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingCoupon ? "Edit Coupon" : "Create Coupon"}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Code</label>
                <input
                  required
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="WELCOME20"
                  className={`${inputClass} uppercase`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_type: e.target.value as FormState["discount_type"] }))
                    }
                    className={inputClass}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>
                    {form.discount_type === "PERCENTAGE" ? "Discount (%)" : "Discount (₦)"}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={form.discount_type === "PERCENTAGE" ? 100 : undefined}
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {form.discount_type === "PERCENTAGE" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Max Discount Amount (₦, optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                    placeholder="No cap"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Minimum Order Amount (₦, optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="No minimum"
                  className={inputClass}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>Valid From (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>Valid Until (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>Max Redemptions (total, optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_redemptions}
                    onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value }))}
                    placeholder="Unlimited"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={labelClass}>Max Redemptions Per User</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.max_redemptions_per_user}
                    onChange={(e) => setForm((f) => ({ ...f, max_redemptions_per_user: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Applicable Category (optional)</label>
                <select
                  value={form.applicable_category}
                  onChange={(e) => setForm((f) => ({ ...f, applicable_category: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">All categories</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Applicable Courses (optional)</label>
                <CourseScopePicker
                  selectedIds={form.applicable_course_ids}
                  onChange={(ids) => setForm((f) => ({ ...f, applicable_course_ids: ids }))}
                />
                <p className="text-xs text-gray-400">
                  Leave both category and courses empty to apply the coupon to everything.
                </p>
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.new_users_only}
                  onChange={(e) => setForm((f) => ({ ...f, new_users_only: e.target.checked }))}
                  className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First-time buyers only
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Active</span>
              </label>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmModal
        isOpen={!!deleteConfirmCoupon}
        onClose={() => setDeleteConfirmCoupon(null)}
        onConfirm={() => {
          if (deleteConfirmCoupon) deleteMutation.mutate(deleteConfirmCoupon.id);
        }}
        title="Delete Coupon"
        description={`Are you sure you want to delete the coupon "${deleteConfirmCoupon?.code}"? This is a soft delete — redemption history is preserved, but the code can no longer be used.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
