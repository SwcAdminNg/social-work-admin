"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeUserRole } from "@/lib/api/users";
import { User } from "@/lib/api/users.types";
import { Modal } from "@/components/generic/ui/Modal";
import { toast } from "sonner";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const ROLES = ["USER", "INSTRUCTOR", "ADMIN"] as const;

export function ChangeRoleModal({ isOpen, onClose, user }: ChangeRoleModalProps) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<User["user_type"] | "">("");

  // Update local state when a new user is passed in or opened
  React.useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(user.user_type);
    }
  }, [isOpen, user]);

  const mutation = useMutation({
    mutationFn: (role: "USER" | "INSTRUCTOR" | "ADMIN") => {
      if (!user) throw new Error("No user selected");
      return changeUserRole(user.id, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated successfully");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !user) return;
    if (selectedRole === user.user_type) {
      onClose();
      return;
    }
    mutation.mutate(selectedRole as "USER" | "INSTRUCTOR" | "ADMIN");
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change User Role" maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role for {user.first_name} {user.last_name}
          </label>
          <select
            id="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as User["user_type"])}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || selectedRole === user.user_type}
            className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
