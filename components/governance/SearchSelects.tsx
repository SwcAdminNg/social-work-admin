"use client";

import { useEffect, useRef, useState } from "react";
import { listManagedCourses } from "@/lib/api/courses-client";
import type { Course } from "@/lib/api/courses.types";
import { getUsers } from "@/lib/api/users";
import type { User } from "@/lib/api/users.types";
import { IconSearch, IconSpinner, IconX } from "@/components/dashboard/icons";

const SEARCH_DEBOUNCE_MS = 250;

export interface SelectedUser {
  id: string;
  name: string;
  email?: string | null;
  username?: string | null;
  userType?: string | null;
}

export interface SelectedCourse {
  id: string;
  title: string;
  status?: string | null;
  version?: string | null;
}

function userLabel(user: User): string {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.email;
}

function toSelectedUser(user: User): SelectedUser {
  return {
    id: user.id,
    name: userLabel(user),
    email: user.email,
    username: user.username,
    userType: user.user_type,
  };
}

function toSelectedCourse(course: Course): SelectedCourse {
  return {
    id: course.id,
    title: course.title,
    status: course.governance_status ?? (course.is_published ? "PUBLISHED" : "DRAFT"),
    version: course.current_version_label,
  };
}

export function UserSearchSelect({
  value,
  onChange,
  placeholder = "Search users by name, username, or email",
  userType,
}: {
  value: SelectedUser | null;
  onChange: (user: SelectedUser | null) => void;
  placeholder?: string;
  userType?: "USER" | "INSTRUCTOR" | "ADMIN";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value || !open) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      getUsers({ search: query.trim() || undefined, page: 1, pageSize: query.trim() ? 8 : 5, userType })
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
  }, [open, query, userType, value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {value ? (
        <SelectedPill
          title={value.name}
          subtitle={[value.email, value.userType].filter(Boolean).join(" · ")}
          onClear={() => {
            onChange(null);
            setQuery("");
            setOpen(false);
          }}
        />
      ) : (
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="input input-with-icon"
          />
          {loading && <IconSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        </div>
      )}

      {open && !value && (
        <ResultPanel>
          {!loading && results.length === 0 ? (
            <EmptyResult>No matching users.</EmptyResult>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onChange(toSelectedUser(user));
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{userLabel(user)}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {user.email} · {user.username} · {user.user_type}
                </span>
              </button>
            ))
          )}
        </ResultPanel>
      )}
    </div>
  );
}

export function CourseSearchSelect({
  value,
  onChange,
  placeholder = "Search courses by title",
}: {
  value: SelectedCourse | null;
  onChange: (course: SelectedCourse | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value || !open) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      listManagedCourses({ search: query.trim() || undefined, page: 1, page_size: query.trim() ? 8 : 5 })
        .then((res) => {
          if (!cancelled) setResults(res.items ?? []);
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
  }, [open, query, value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {value ? (
        <SelectedPill
          title={value.title}
          subtitle={[value.status, value.version ? `v${value.version}` : null].filter(Boolean).join(" · ")}
          onClear={() => {
            onChange(null);
            setQuery("");
            setOpen(false);
          }}
        />
      ) : (
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="input input-with-icon"
          />
          {loading && <IconSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        </div>
      )}

      {open && !value && (
        <ResultPanel>
          {!loading && results.length === 0 ? (
            <EmptyResult>No matching courses.</EmptyResult>
          ) : (
            results.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  onChange(toSelectedCourse(course));
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{course.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {course.governance_status ?? (course.is_published ? "Published" : "Draft")}
                  {course.current_version_label ? ` · v${course.current_version_label}` : ""}
                </span>
              </button>
            ))
          )}
        </ResultPanel>
      )}
    </div>
  );
}

function SelectedPill({ title, subtitle, onClear }: { title: string; subtitle?: string; onClear: () => void }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-xl border border-brand-600/20 bg-brand-600/5 px-3 py-2 dark:border-brand-400/20 dark:bg-brand-400/10">
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        {subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
      </span>
      <button type="button" onClick={onClear} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Clear selection">
        <IconX size={16} />
      </button>
    </div>
  );
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-ink-line dark:bg-ink-surface">
      {children}
    </div>
  );
}

function EmptyResult({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-2.5 text-sm text-slate-400">{children}</p>;
}
