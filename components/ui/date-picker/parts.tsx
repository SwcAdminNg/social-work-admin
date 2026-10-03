"use client";

import { forwardRef, useId } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { CalendarDays, Clock, X, type LucideIcon } from "lucide-react";
import { Button, Segmented, cn } from "../primitives";

/* ───────────── Responsive dialog shell ───────────── */

/**
 * Modal that always fits inside the device: a bottom sheet on phones and a
 * centred dialog from `sm` up. Width and height are capped to the dynamic
 * viewport (minus safe areas); only the body scrolls, so the header and the
 * action footer are always reachable — even on a landscape phone.
 */
export function PickerDialog({
  open,
  onOpenChange,
  title,
  summary,
  size = "sm",
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  summary?: React.ReactNode;
  size?: "sm" | "lg";
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[80] animate-fade-in bg-slate-950/50 backdrop-blur-[2px]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-[81] flex flex-col overflow-hidden border-slate-200 bg-white outline-none dark:border-ink-line dark:bg-ink-surface",
            // Phone: bottom sheet, full width, never taller than the visible viewport.
            "inset-x-0 bottom-0 max-h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top)))] w-full animate-sheet-up rounded-t-3xl border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_60px_-30px_rgba(15,23,42,0.45)]",
            // sm+: centred dialog, capped to the viewport on both axes.
            "sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:animate-pop-in sm:rounded-2xl sm:border sm:pb-0 sm:shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)]",
            size === "lg" ? "sm:max-w-[50rem]" : "sm:max-w-[24rem]",
          )}
        >
          {/* Grab handle (phones) */}
          <div aria-hidden="true" className="flex justify-center pt-2.5 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/15" />
          </div>

          <div className="flex flex-shrink-0 items-start gap-3 border-b border-slate-100 px-4 pb-3 pt-2.5 sm:px-5 sm:pt-4 dark:border-ink-line">
            <span className="mt-0.5 hidden h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 min-[360px]:grid dark:bg-brand-400/12 dark:text-brand-300">
              <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </RadixDialog.Title>
              <p className="mt-0.5 min-h-5 truncate text-[13px] text-slate-500 dark:text-slate-400" aria-live="polite">
                {summary}
              </p>
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close" className="-mr-1.5" />
            </RadixDialog.Close>
          </div>

          <div className="@container min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5">
            {children}
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5 dark:border-ink-line dark:bg-white/[0.02]">
            {footer}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ───────────── Trigger field ───────────── */

type TriggerProps = {
  id?: string;
  display: string;
  placeholder: string;
  icon?: LucideIcon;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  /** Raw value, mirrored into a hidden input so native `required` validation still works. */
  value: string;
  onOpen: () => void;
  onClear?: () => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
};

/** Looks like the `Input` primitive; opens the picker on click / Enter / Space / ArrowDown. */
export const PickerTrigger = forwardRef<HTMLButtonElement, TriggerProps>(function PickerTrigger(
  { id, display, placeholder, icon: Icon = CalendarDays, disabled, invalid, required, name, value, onOpen, onClear, size = "md", className, ...rest },
  ref,
) {
  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <button
        ref={ref}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={rest["aria-label"]}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white pl-3 text-left text-sm text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-slate-300 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-ink-line dark:bg-ink-page/60 dark:text-white dark:hover:border-white/20 dark:disabled:bg-white/[0.03]",
          size === "sm" ? "h-9" : "h-10",
          onClear && value ? "pr-9" : "pr-3",
          invalid && "border-rose-400",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" strokeWidth={2} />
        <span className={cn("min-w-0 flex-1 truncate", !display && "text-slate-400 dark:text-slate-500")}>
          {display || placeholder}
        </span>
      </button>
      {onClear && value && !disabled && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear date"
          className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      )}
      {/* Keeps native form validation (`required`) and `name`-based form posts working. */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        required={required}
        value={value}
        onChange={() => {}}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
      />
    </div>
  );
});

/* ───────────── Time field ───────────── */

export type TimeValue = { hours: number; minutes: number };

const SELECT =
  "h-10 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")] bg-[length:1.1rem] bg-[right_0.4rem_center] bg-no-repeat pl-3 pr-7 text-sm tabular-nums text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 dark:border-ink-line dark:bg-ink-page/60 dark:text-white";

/** 12-hour time entry: hour + minute selects and an AM/PM toggle. Fits ~260px. */
export function TimeField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const pm = value.hours >= 12;
  const hour12 = value.hours % 12 === 0 ? 12 : value.hours % 12;
  // 5-minute steps, plus the current minute if it's off-step (e.g. loaded from the API).
  const minuteOptions = Array.from(new Set([...Array.from({ length: 12 }, (_, i) => i * 5), value.minutes])).sort((a, b) => a - b);

  const setHour12 = (h: number) => onChange({ ...value, hours: (h % 12) + (pm ? 12 : 0) });
  const setPm = (next: boolean) => onChange({ ...value, hours: (value.hours % 12) + (next ? 12 : 0) });

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        <Clock className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.2} />
        {label}
      </legend>
      <div className="flex min-w-0 items-center gap-2">
        <label htmlFor={`${id}-h`} className="sr-only">
          Hour
        </label>
        <select id={`${id}-h`} value={hour12} onChange={(e) => setHour12(Number(e.target.value))} className={SELECT}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="font-bold text-slate-400">:</span>
        <label htmlFor={`${id}-m`} className="sr-only">
          Minute
        </label>
        <select
          id={`${id}-m`}
          value={value.minutes}
          onChange={(e) => onChange({ ...value, minutes: Number(e.target.value) })}
          className={SELECT}
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <Segmented
          size="sm"
          className="flex-shrink-0"
          value={pm ? "pm" : "am"}
          onChange={(k) => setPm(k === "pm")}
          options={[
            { key: "am", label: "AM" },
            { key: "pm", label: "PM" },
          ]}
        />
      </div>
    </fieldset>
  );
}

/* ───────────── Preset chips ───────────── */

/** Horizontal, swipeable chip row on narrow screens; a vertical list when `vertical`. */
export function PresetList({
  items,
  activeIndex,
  onPick,
  stackWhenWide,
  className,
}: {
  items: string[];
  activeIndex: number;
  onPick: (index: number) => void;
  /** Becomes a vertical sidebar list once the dialog body is ≥ 44rem wide. */
  stackWhenWide?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5",
        stackWhenWide && "@min-[44rem]:mx-0 @min-[44rem]:overflow-visible @min-[44rem]:px-0",
        className,
      )}
    >
      <div
        role="group"
        aria-label="Quick picks"
        className={cn("flex w-max gap-1.5", stackWhenWide && "@min-[44rem]:w-full @min-[44rem]:flex-col @min-[44rem]:gap-1")}
      >
        {items.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(i)}
            aria-pressed={i === activeIndex}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
              stackWhenWide && "@min-[44rem]:h-9 @min-[44rem]:rounded-lg @min-[44rem]:ring-0",
              i === activeIndex
                ? "bg-brand-600 text-white ring-brand-600 dark:bg-brand-400 dark:text-[#06130d] dark:ring-brand-400"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-white/[0.03] dark:text-slate-300 dark:ring-ink-line dark:hover:bg-white/8",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
