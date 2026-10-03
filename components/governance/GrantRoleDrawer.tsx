"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { grantStaffRole, listStaffRoles } from "@/lib/api/governance-client";
import type { GovernanceRole } from "@/lib/api/governance.types";
import { IconSpinner, IconX } from "@/components/dashboard/icons";
import { Badge, humanize, roleDetails, roleOptions, Segmented } from "./GovernanceUtils";
import { CourseSearchSelect, UserSearchSelect, type SelectedCourse, type SelectedUser } from "./SearchSelects";

const roleGroups = ["Authoring", "Review", "Approval"] as const;

const expiryPresets = [
  { key: "never", label: "No expiry", days: null },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "1 year", days: 365 },
  { key: "custom", label: "Custom", days: null },
] as const;

type ExpiryKey = (typeof expiryPresets)[number]["key"];

export interface GrantPreset {
  user?: SelectedUser | null;
  course?: SelectedCourse | null;
}

export function GrantRoleDrawer({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: GrantPreset;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-[2px] data-[state=open]:animate-[fadeIn_150ms_ease-out]" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl outline-none dark:bg-gray-900 data-[state=open]:animate-[slideInRight_220ms_cubic-bezier(0.16,1,0.3,1)]"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
            <div>
              <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">Grant a staff role</Dialog.Title>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Takes effect immediately.</p>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200" aria-label="Close">
              <IconX size={18} />
            </Dialog.Close>
          </div>

          <GrantRoleForm preset={preset} onDone={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Mounted fresh each time the drawer opens, so the form always starts clean (or from the preset). */
function GrantRoleForm({ preset, onDone }: { preset?: GrantPreset; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SelectedUser | null>(preset?.user ?? null);
  const [role, setRole] = useState<GovernanceRole>("ACADEMIC_REVIEWER");
  const [scope, setScope] = useState<"platform" | "course">(preset?.course ? "course" : "platform");
  const [course, setCourse] = useState<SelectedCourse | null>(preset?.course ?? null);
  const [expiry, setExpiry] = useState<ExpiryKey>("never");
  const [customExpiry, setCustomExpiry] = useState("");
  const [reason, setReason] = useState("");

  const existing = useQuery({
    queryKey: ["staff-roles", "user", user?.id],
    queryFn: () => listStaffRoles({ user_id: user!.id, page_size: 50 }),
    enabled: !!user,
  });
  const existingRoles = (existing.data?.items ?? []).filter((item) => !item.revoked_at);

  const duplicate = existingRoles.some(
    (item) => item.role === role && (item.course_id ?? null) === (scope === "course" ? course?.id ?? null : null),
  );

  function expiresAt(): string | null {
    const choice = expiryPresets.find((p) => p.key === expiry);
    if (choice?.days) return new Date(Date.now() + choice.days * 86_400_000).toISOString();
    if (expiry === "custom" && customExpiry) return new Date(customExpiry).toISOString();
    return null;
  }

  const grant = useMutation({
    mutationFn: () =>
      grantStaffRole({
        user_id: user!.id,
        role,
        course_id: scope === "course" ? course?.id ?? null : null,
        reason: reason.trim() || null,
        expires_at: expiresAt(),
      }),
    onSuccess: () => {
      toast.success(`${humanize(role)} granted to ${user?.name}.`);
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      onDone();
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to grant role."),
  });

  const missing = !user
    ? "Choose a person"
    : scope === "course" && !course
      ? "Choose a course"
      : expiry === "custom" && !customExpiry
        ? "Pick an expiry date"
        : duplicate
          ? "They already have this role"
          : null;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!missing) grant.mutate();
      }}
    >
      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
        <Step n={1} title="Who">
          <UserSearchSelect value={user} onChange={setUser} placeholder="Search by name or email" />
          {user && existingRoles.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>Already has:</span>
              {existingRoles.map((item) => (
                <Badge key={item.assignment_id ?? item.id} tone="gray">
                  {humanize(item.role)}
                  {item.course ? ` · ${item.course.title}` : ""}
                </Badge>
              ))}
            </div>
          )}
        </Step>

        <Step n={2} title="Role">
          <div className="space-y-4">
            {roleGroups.map((group) => (
              <div key={group}>
                <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gray-400">{group}</p>
                <div className="grid gap-1.5" role="radiogroup" aria-label={`${group} roles`}>
                  {roleOptions
                    .filter((r) => roleDetails[r].group === group)
                    .map((r) => {
                      const active = role === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setRole(r)}
                          className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                            active
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 dark:border-[#52b788] dark:bg-[#52b788]/10"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              active ? "border-[#2D6A4F] dark:border-[#52b788]" : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {active && <span className="h-1.5 w-1.5 rounded-full bg-[#2D6A4F] dark:bg-[#52b788]" />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">{humanize(r)}</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">{roleDetails[r].description}</span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Step>

        <Step n={3} title="Where">
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "platform", label: "Platform-wide" },
              { value: "course", label: "One course" },
            ]}
          />
          {scope === "course" && (
            <div className="mt-2.5">
              <CourseSearchSelect value={course} onChange={setCourse} placeholder="Search course title" />
            </div>
          )}
        </Step>

        <Step n={4} title="How long">
          <div className="flex flex-wrap gap-1.5">
            {expiryPresets.map((p) => (
              <Chip key={p.key} active={expiry === p.key} onClick={() => setExpiry(p.key)}>
                {p.label}
              </Chip>
            ))}
          </div>
          {expiry === "custom" && (
            <input
              type="datetime-local"
              value={customExpiry}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setCustomExpiry(e.target.value)}
              className="input mt-2.5"
              aria-label="Custom expiry date"
            />
          )}
        </Step>

        <div>
          <label htmlFor="grant-reason" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="grant-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is this role being granted?"
            className="input mt-1.5 resize-none"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/40">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {user ? (
            <>
              <strong className="text-gray-900 dark:text-white">{user.name}</strong> becomes{" "}
              <strong className="text-gray-900 dark:text-white">{humanize(role)}</strong>{" "}
              {scope === "course" ? (course ? <>on {course.title}</> : "on a course") : "platform-wide"}
              {expiry === "never" ? "." : `, ${expiry === "custom" ? "until the chosen date" : `for ${expiryPresets.find((p) => p.key === expiry)?.label}`}.`}
            </>
          ) : (
            <span className="text-gray-400">Choose a person to continue.</span>
          )}
        </p>
        <div className="flex items-center justify-end gap-2">
          <Dialog.Close className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </Dialog.Close>
          <button
            type="submit"
            disabled={!!missing || grant.isPending}
            title={missing ?? undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1e4d38] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {grant.isPending && <IconSpinner />}
            {duplicate ? "Already granted" : "Grant role"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[0.65rem] text-white dark:bg-white dark:text-gray-900">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-[#2D6A4F] bg-[#2D6A4F] text-white dark:border-[#52b788] dark:bg-[#52b788] dark:text-gray-900"
          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
