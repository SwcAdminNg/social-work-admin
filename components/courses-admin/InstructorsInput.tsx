"use client";

import { useState, useEffect, useRef } from "react";
import { IconPlus, IconTrash, IconSearch } from "@/components/dashboard/icons";
import { getUsers } from "@/lib/api/users";
import type { User } from "@/lib/api/users.types";
import type { CourseInstructorInputDTO } from "@/lib/api/courses.types";

interface InstructorsInputProps {
  value: CourseInstructorInputDTO[];
  onChange: (value: CourseInstructorInputDTO[]) => void;
}

export function InstructorsInput({ value, onChange }: InstructorsInputProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState<{ [index: number]: boolean }>({});

  const addInstructor = () => {
    onChange([...value, { name: "", user_id: null }]);
  };

  const removeInstructor = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateInstructor = (index: number, updates: Partial<CourseInstructorInputDTO>) => {
    const next = [...value];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const [instructorRes, adminRes] = await Promise.all([
          getUsers({ search, userType: "INSTRUCTOR", pageSize: 15 }),
          getUsers({ search, userType: "ADMIN", pageSize: 15 })
        ]);
        
        if (active) {
          // Combine and deduplicate users (just in case)
          const combined = [...instructorRes.data, ...adminRes.data];
          const uniqueUsers = Array.from(new Map(combined.map(u => [u.id, u])).values());
          setUsers(uniqueUsers);
        }
      } catch (err) {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
        Instructors
      </label>
      
      <div className="flex flex-col gap-3">
        {value.map((instructor, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 relative">
            <div className="flex-1 w-full">
              <label className="block text-xs text-gray-500 mb-1">Display Name (Required)</label>
              <input
                type="text"
                value={instructor.name}
                onChange={(e) => updateInstructor(i, { name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                required
              />
            </div>
            
            <div className="flex-1 w-full relative">
              <label className="block text-xs text-gray-500 mb-1">Link Platform Account (Optional)</label>
              <div 
                className="relative cursor-pointer w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#52b788]"
                onClick={() => setIsOpen({ ...isOpen, [i]: !isOpen[i] })}
              >
                {instructor.user_id ? (
                  <div className="flex items-center justify-between">
                    <span>Account linked ({instructor.user_id.substring(0, 8)}...)</span>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateInstructor(i, { user_id: null });
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400">Select an account...</span>
                )}
              </div>
              
              {isOpen[i] && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 flex flex-col">
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto p-1 flex-1">
                    {loading ? (
                      <div className="p-2 text-sm text-gray-500 text-center">Loading...</div>
                    ) : users.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">No accounts found</div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md flex justify-between items-center"
                          onClick={() => {
                            updateInstructor(i, { user_id: u.id, name: instructor.name || `${u.first_name} ${u.last_name}`.trim() });
                            setIsOpen({ ...isOpen, [i]: false });
                            setSearch("");
                          }}
                        >
                          <span>{u.first_name} {u.last_name}</span>
                          <span className="text-xs text-gray-400">{u.email}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeInstructor(i)}
                disabled={value.length <= 1}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
                title="Remove instructor"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addInstructor}
        className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D6A4F] dark:text-[#52b788] hover:underline"
      >
        <IconPlus /> Add another instructor
      </button>
    </div>
  );
}
