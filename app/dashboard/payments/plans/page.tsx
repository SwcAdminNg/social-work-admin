"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "@/lib/api/payments-client";
import { SubscriptionPlanResponse } from "@/lib/api/payments.types";
import { IconPlus, IconTrash, IconSpinner, IconReceipt } from "@/components/dashboard/icons";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ConfirmModal } from "@/components/generic/ui/ConfirmModal";
import * as Dialog from "@radix-ui/react-dialog";

export default function PlansPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: () => getSubscriptionPlans(),
    enabled: !!session,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<SubscriptionPlanResponse | null>(null);
  const [deleteConfirmPlan, setDeleteConfirmPlan] = React.useState<SubscriptionPlanResponse | null>(null);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [durationDays, setDurationDays] = React.useState("30");
  const [price, setPrice] = React.useState("");
  const [isFreeTrial, setIsFreeTrial] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      toast.success("Plan created successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      closeModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create plan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSubscriptionPlan(id, payload),
    onSuccess: () => {
      toast.success("Plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      closeModal();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update plan"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      toast.success("Plan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
      setDeleteConfirmPlan(null);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete plan"),
  });

  function openModal(plan?: SubscriptionPlanResponse) {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setDescription(plan.description);
      setDurationDays(String(plan.duration_days));
      setPrice(String(plan.price));
      setIsFreeTrial(plan.is_free_trial);
      setIsActive(plan.is_active);
    } else {
      setEditingPlan(null);
      setName("");
      setDescription("");
      setDurationDays("30");
      setPrice("");
      setIsFreeTrial(false);
      setIsActive(true);
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingPlan(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      description,
      duration_days: parseInt(durationDays, 10),
      price: parseFloat(price),
      is_free_trial: isFreeTrial,
      ...(editingPlan ? { is_active: isActive } : {}),
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload });
    } else {
      createMutation.mutate(payload as any);
    }
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-400">
        Failed to fetch subscription plans. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Plans</h2>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors shadow-sm"
        >
          <IconPlus /> Create Plan
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><IconSpinner className="text-[#2D6A4F]" /></div>
      ) : plans?.length === 0 ? (
        <EmptyState
          icon={IconReceipt}
          title="No subscription plans"
          description="Create your first subscription plan to start offering access."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans?.map((plan) => (
            <div key={plan.id} className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden relative">
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{plan.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${plan.is_active ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-[#2D6A4F] dark:text-[#52b788]">₦{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 font-medium">/ {plan.duration_days} days</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                {plan.is_free_trial && (
                  <span className="self-start inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                    Free Trial
                  </span>
                )}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2">
                <button
                  onClick={() => openModal(plan)}
                  className="flex-1 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmPlan(plan)}
                  className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label="Delete plan"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl z-50 p-6 border border-gray-200 dark:border-gray-800">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingPlan ? "Edit Plan" : "Create Plan"}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                <textarea required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Price (₦)</label>
                  <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Duration (Days)</label>
                  <input required type="number" min="1" value={durationDays} onChange={e => setDurationDays(e.target.value)} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2D6A4F] outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={isFreeTrial} onChange={e => setIsFreeTrial(e.target.checked)} className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Free Trial</span>
              </label>
              {editingPlan && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Active</span>
                </label>
              )}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] rounded-xl transition-colors">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Plan"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmModal
        isOpen={!!deleteConfirmPlan}
        onClose={() => setDeleteConfirmPlan(null)}
        onConfirm={() => {
          if (deleteConfirmPlan) deleteMutation.mutate(deleteConfirmPlan.id);
        }}
        title="Delete Plan"
        description={`Are you sure you want to delete the plan "${deleteConfirmPlan?.name}"? It will be soft-deleted and marked inactive.`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
