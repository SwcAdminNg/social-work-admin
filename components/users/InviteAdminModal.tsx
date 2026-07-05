"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteAdmin } from "@/lib/api/users";
import { getUsernameSuggestions, checkUsernameAvailability } from "@/lib/api/auth";
import { InviteAdminRequestDTO } from "@/lib/api/users.types";
import { Modal } from "@/components/generic/ui/Modal";

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteAdminModal({ isOpen, onClose }: InviteAdminModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<InviteAdminRequestDTO>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    platform: "NG",
  });
  const [error, setError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch suggestions when first_name and last_name are filled
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (formData.first_name && formData.last_name) {
        setIsLoadingSuggestions(true);
        try {
          const res = await getUsernameSuggestions(formData.first_name, formData.last_name);
          const sug = res.data?.suggestions || [];
          setSuggestions(sug);
          
          // Auto select first suggestion if username is empty
          if (sug.length > 0 && !formData.username) {
            setFormData((prev) => ({ ...prev, username: sug[0] }));
            checkAvailability(sug[0]);
          }
        } catch (err) {
          console.error("Failed to fetch suggestions", err);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }
    };
    
    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.first_name, formData.last_name]);

  const checkAvailability = async (username: string) => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }
    setIsCheckingUsername(true);
    try {
      const res = await checkUsernameAvailability(username);
      setUsernameAvailable(res.data?.available ?? null);
    } catch (err) {
      console.error("Failed to check username availability", err);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (data: InviteAdminRequestDTO) => inviteAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone_number: "",
        platform: "NG",
      });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to send invitation.");
    },
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "username") {
      setUsernameAvailable(null);
      // Optional: you can debounce this or check onBlur
    }
  };

  const handleUsernameBlur = () => {
    if (formData.username) {
      checkAvailability(formData.username);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate({
      ...formData,
      phone_number: formData.phone_number || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Admin" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
              <span>Username</span>
              {isCheckingUsername && <span className="text-xs text-gray-500">Checking...</span>}
              {!isCheckingUsername && usernameAvailable === true && <span className="text-xs text-green-600 dark:text-green-400">Available</span>}
              {!isCheckingUsername && usernameAvailable === false && <span className="text-xs text-red-600 dark:text-red-400">Not available</span>}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-z0-9._]+$"
              title="Only lowercase letters, numbers, dots, or underscores."
              value={formData.username}
              onChange={handleChange}
              onBlur={handleUsernameBlur}
              className={`w-full rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] ${
                usernameAvailable === false
                  ? "border-red-500 focus:ring-red-500"
                  : usernameAvailable === true
                  ? "border-green-500 focus:ring-green-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {isLoadingSuggestions && <span className="text-xs text-gray-500 py-1">Loading suggestions...</span>}
                {!isLoadingSuggestions && suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, username: sug }));
                      checkAvailability(sug);
                    }}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="text"
                maxLength={20}
                value={formData.phone_number || ""}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              />
            </div>
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
              >
                <option value="NG">NG</option>
                <option value="COM">COM</option>
              </select>
            </div>
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
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
