"use client";

import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { Button, cn } from "@/components/ui/primitives";

export const DEFAULT_PASS_MARK = 70;
const PRESETS = [50, 60, 70, 80];

export function clampPassMark(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** One-line plain-English meaning of a pass mark. */
export function passMarkMeaning(value: number, assessmentCount?: number) {
  if (assessmentCount === 0) return "This course has no assessments yet, so everyone who finishes it earns the certificate.";
  if (value === 0) return "Every learner who finishes the course earns the certificate, whatever they score.";
  if (value === 100) return "Learners need a perfect score on every assessment — very few will earn it.";
  return `Learners need an overall score of at least ${value}% to earn the certificate.`;
}

/**
 * Certificate pass mark: a slider, an exact number, quick presets and a bar
 * that shows the pass / no-certificate split. Value is a whole percentage 0–100.
 */
export function PassMarkField({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Smaller layout for forms (no presets row). */
  compact?: boolean;
}) {
  const id = useId();
  const v = clampPassMark(Number.isFinite(value) ? value : DEFAULT_PASS_MARK);

  return (
    <div className={cn("flex flex-col gap-4", disabled && "opacity-60")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-extrabold tracking-tight text-slate-950 tabular-nums dark:text-white">{v}</span>
          <span className="font-display text-xl font-bold text-slate-400">%</span>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">overall score to pass</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-n`} className="sr-only">
            Pass mark percentage
          </label>
          <div className="relative w-24">
            <input
              id={`${id}-n`}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={v}
              disabled={disabled}
              onChange={(e) => e.target.value !== "" && onChange(clampPassMark(Number(e.target.value)))}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm font-semibold tabular-nums text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 disabled:cursor-not-allowed dark:border-ink-line dark:bg-ink-page/60 dark:text-white"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">%</span>
          </div>
          {v !== DEFAULT_PASS_MARK && !compact && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => onChange(DEFAULT_PASS_MARK)} disabled={disabled}>
              Default ({DEFAULT_PASS_MARK}%)
            </Button>
          )}
        </div>
      </div>

      {/* Slider over a pass / no-certificate bar */}
      <div className="flex flex-col gap-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8" aria-hidden="true">
          <div className="absolute inset-y-0 left-0 bg-rose-200/70 dark:bg-rose-500/25" style={{ width: `${v}%` }} />
          <div className="absolute inset-y-0 right-0 bg-gradient-to-r from-brand-300 to-brand-500 dark:from-brand-500/60 dark:to-brand-400" style={{ width: `${100 - v}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={v}
          disabled={disabled}
          aria-label="Pass mark"
          aria-valuetext={`${v} percent`}
          onChange={(e) => onChange(clampPassMark(Number(e.target.value)))}
          className="-mt-[22px] h-4 w-full cursor-pointer appearance-none bg-transparent accent-brand-600 disabled:cursor-not-allowed dark:accent-brand-400 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(15,23,42,0.35)] dark:[&::-webkit-slider-thumb]:bg-brand-400"
        />
        <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider">
          <span className="text-rose-500 dark:text-rose-300">No certificate below {v}%</span>
          <span className="text-brand-600 dark:text-brand-300">Certificate</span>
        </div>
      </div>

      {!compact && (
        <div role="group" aria-label="Common pass marks" className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p)}
              aria-pressed={v === p}
              className={cn(
                "h-8 cursor-pointer rounded-full px-3 text-[13px] font-semibold tabular-nums ring-1 ring-inset transition-colors disabled:cursor-not-allowed",
                v === p
                  ? "bg-brand-600 text-white ring-brand-600 dark:bg-brand-400 dark:text-[#06130d] dark:ring-brand-400"
                  : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-white/[0.03] dark:text-slate-300 dark:ring-ink-line dark:hover:bg-white/8",
              )}
            >
              {p}%{p === DEFAULT_PASS_MARK ? " · default" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
