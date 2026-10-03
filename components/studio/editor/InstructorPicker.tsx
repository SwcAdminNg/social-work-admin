"use client";

import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Loader2, Plus, Search, UserPlus } from "lucide-react";
import { Avatar, Input } from "@/components/ui/primitives";
import { getUsers } from "@/lib/api/users";
import type { User } from "@/lib/api/users.types";

export type Credit = { user_id: string | null; name: string; profile_picture_url?: string | null };

/** The users API may include a photo even though the shared `User` type omits it. */
type Account = User & { profile_picture_url?: string | null };

const fullName = (u: User) => [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;

/**
 * Search platform instructors/admins to credit on a course, or add any typed
 * name as an external contributor. Calls `onPick` with the chosen credit.
 */
export function InstructorPicker({
  onPick,
  exclude = [],
  disabled,
}: {
  onPick: (credit: Credit) => void;
  /** Already-credited people (hidden from results). */
  exclude?: Credit[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Debounced search across instructors and admins, de-duplicated by id.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [inst, admins] = await Promise.all([
          getUsers({ search: q, userType: "INSTRUCTOR", pageSize: 10 }),
          getUsers({ search: q, userType: "ADMIN", pageSize: 10 }),
        ]);
        if (cancelled) return;
        const seen = new Set<string>();
        setResults(
          [...(inst.data ?? []), ...(admins.data ?? [])].filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true))),
        );
        setActive(0);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  const excludedIds = new Set(exclude.map((c) => c.user_id).filter(Boolean));
  const excludedNames = new Set(exclude.map((c) => c.name.trim().toLowerCase()));
  const q = query.trim();
  const accounts = q.length >= 2 ? results.filter((u) => !excludedIds.has(u.id)) : [];
  const canAddExternal = q.length >= 2 && !excludedNames.has(q.toLowerCase());
  const rows = [...accounts.map((u) => ({ kind: "user" as const, u })), ...(canAddExternal ? [{ kind: "external" as const }] : [])];

  function pick(index: number) {
    const row = rows[index];
    if (!row) return;
    if (row.kind === "user") onPick({ user_id: row.u.id, name: fullName(row.u), profile_picture_url: row.u.profile_picture_url ?? null });
    else onPick({ user_id: null, name: q });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <Popover.Root open={open && q.length >= 2} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div ref={anchorRef} className="w-full">
          <Input
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(rows.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(active);
              } else if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search instructors, or type a name to add"
            aria-label="Add an instructor"
            leading={<Search className="h-4 w-4" />}
          />
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className="z-[90] max-h-[min(20rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] min-w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_48px_-16px_rgba(15,23,42,0.35)] dark:border-ink-line dark:bg-ink-raised"
        >
          {loading && !accounts.length && (
            <p className="flex items-center gap-2 px-2.5 py-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </p>
          )}
          {rows.map((row, i) => (
            <button
              key={row.kind === "user" ? row.u.id : "external"}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onMouseMove={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm ${
                i === active ? "bg-slate-100 dark:bg-white/8" : ""
              }`}
            >
              {row.kind === "user" ? (
                <>
                  <Avatar name={fullName(row.u)} src={row.u.profile_picture_url} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">{fullName(row.u)}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {row.u.user_type === "ADMIN" ? "Admin" : "Instructor"} · {row.u.email}
                    </span>
                  </span>
                  <UserPlus className="h-4 w-4 flex-shrink-0 text-slate-400" />
                </>
              ) : (
                <>
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">Add “{q}”</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">As an external contributor (no account)</span>
                  </span>
                </>
              )}
            </button>
          ))}
          {!loading && !rows.length && <p className="px-2.5 py-2 text-sm text-slate-500 dark:text-slate-400">Already credited.</p>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
