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
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
        Instructors
      </label>
      
      <div className="flex flex-col gap-3">
        {value.map((instructor, i) => {
          const isGuest = (instructor as { is_guest?: boolean }).is_guest === true;
          return (
          <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-ink-line relative">
            <div className="flex-1 w-full">
              <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                Display Name (Required)
                {isGuest && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Guest
                  </span>
                )}
              </label>
              <input
                type="text"
                value={instructor.name}
                onChange={(e) => updateInstructor(i, { name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
                required
              />
              {isGuest && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Credited automatically as a guest lecturer on a section. Remove them from that
                  section to fully unlist them.
                </p>
              )}
            </div>
            
            <div className="flex-1 w-full relative">
              <label className="block text-xs text-slate-500 mb-1">Link Platform Account (Optional)</label>
              <div 
                className="relative cursor-pointer w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-ink-surface px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-400"
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
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400">Select an account...</span>
                )}
              </div>
              
              {isOpen[i] && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 flex flex-col">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                    <input
                      type="text"
                      autoComplete="off"

                      placeholder="Search accounts..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-ink-surface px-3 py-1.5 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto p-1 flex-1">
                    {loading ? (
                      <div className="p-2 text-sm text-slate-500 text-center">Loading...</div>
                    ) : users.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500 text-center">No accounts found</div>
                    ) : (
                      users.map((u) => (
                        <div
                          key={u.id}
                          className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer rounded-md flex justify-between items-center"
                          onClick={() => {
                            updateInstructor(i, { user_id: u.id, name: instructor.name || `${u.first_name} ${u.last_name}`.trim() });
                            setIsOpen({ ...isOpen, [i]: false });
                            setSearch("");
                          }}
                        >
                          <span>{u.first_name} {u.last_name}</span>
                          <span className="text-xs text-slate-400">{u.email}</span>
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
                className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
                title="Remove instructor"
              >
                <IconTrash />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addInstructor}
        className="self-start inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
      >
        <IconPlus /> Add another instructor
      </button>
    </div>
  );
}
