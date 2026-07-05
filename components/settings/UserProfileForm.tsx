"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updateCurrentUser } from "@/lib/api/users";
import { UserUpdateDTO, User } from "@/lib/api/users.types";

export function UserProfileForm() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
  });

  const user = data?.data;

  const [formData, setFormData] = useState<UserUpdateDTO>({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    gender: "MALE",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        phone_number: user.phone_number || "",
        gender: user.gender || "MALE",
        address: user.address || "",
      });
    }
  }, [user]);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: (updateData: UserUpdateDTO) => updateCurrentUser(updateData),
    onSuccess: (res) => {
      queryClient.setQueryData(["currentUser"], res);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (err: any) => {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
        Error loading profile: {(queryError as any).message}
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Personal Information
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update your profile details and settings here.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {message && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="first_name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              maxLength={100}
              value={formData.first_name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="last_name"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              maxLength={100}
              value={formData.last_name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={50}
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone_number"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>
            <input
              id="phone_number"
              name="phone_number"
              type="text"
              maxLength={20}
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="gender"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] appearance-none"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Address{" "}
              <span className="text-xs font-normal text-gray-400">
                (Read-only)
              </span>
            </label>
            <input
              id="email"
              type="email"
              readOnly
              value={user?.email || ""}
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            maxLength={500}
            value={formData.address}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition-all focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788] resize-none"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-8 py-3 text-sm font-bold text-white bg-[#2D6A4F] hover:bg-[#1e4d38] dark:hover:bg-[#3d8c68] rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {mutation.isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
