"use client";

import { useEffect, useRef, useState } from "react";
import { getUsers } from "@/lib/api/users";
import type { User } from "@/lib/api/users.types";
import { IconSearch, IconSpinner, IconX } from "@/components/dashboard/icons";

export interface PickedUser {
  id: string;
  label: string;
  email?: string;
}

function toPicked(user: User): PickedUser {
  const label = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  return { id: user.id, label, email: user.email };
}

const SEARCH_DEBOUNCE_MS = 300;

export function UserPicker({
  value,
  onChange,
  placeholder = "Search users by name, username or email…",
}: {
  value: PickedUser[];
  onChange: (users: PickedUser[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      getUsers({ search: query.trim(), pageSize: 10 })
        .then((res) => {
          if (!cancelled) setResults(res.data ?? []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = new Set(value.map((u) => u.id));
  const filteredResults = results.filter((u) => !selectedIds.has(u.id));

  function addUser(user: User) {
    onChange([...value, toPicked(user)]);
    setQuery("");
    setResults([]);
  }

  function removeUser(id: string) {
    onChange(value.filter((u) => u.id !== id));
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#2D6A4F]/10 dark:bg-[#52b788]/15 text-[#2D6A4F] dark:text-[#52b788] text-xs font-semibold"
            >
              {user.label}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="text-current opacity-70 hover:opacity-100 cursor-pointer"
                aria-label={`Remove ${user.label}`}
              >
                <IconX size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
        {loading && (
          <IconSpinner className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 z-10 max-h-56 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          {!loading && filteredResults.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-400">No matching users.</p>
          ) : (
            filteredResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => addUser(user)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
