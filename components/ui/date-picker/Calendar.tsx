"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../primitives";
import {
  addDays,
  addMonths,
  clampDay,
  compareDay,
  formatLongDay,
  formatMonthYear,
  isDayDisabled,
  isSameDay,
  isSameMonth,
  monthLabels,
  monthMatrix,
  startOfDay,
  startOfMonth,
  weekdayLabels,
} from "./date-utils";

type View = "days" | "months" | "years";

export type CalendarProps = {
  /** First visible month. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** 2 shows a second month side by side when the container is wide enough. */
  months?: 1 | 2;
  /** Single-date selection. */
  selected?: Date | null;
  /** Range selection. */
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  onSelect: (day: Date) => void;
  min?: Date | null;
  max?: Date | null;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: number;
};

const NAV_BUTTON =
  "grid h-9 w-9 flex-shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white";

export function Calendar({
  month,
  onMonthChange,
  months = 1,
  selected,
  rangeStart,
  rangeEnd,
  onSelect,
  min,
  max,
  weekStartsOn = 1,
}: CalendarProps) {
  const [view, setView] = useState<View>("days");
  const [hover, setHover] = useState<Date | null>(null);
  const [focused, setFocused] = useState<Date>(() =>
    clampDay(startOfDay(selected ?? rangeStart ?? (isSameMonth(month, new Date()) ? new Date() : month)), min, max),
  );
  const focusOnRender = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const secondPanelRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const weekdays = useMemo(() => weekdayLabels(weekStartsOn), [weekStartsOn]);

  // Move DOM focus to the focused day after keyboard navigation re-renders the grid.
  useEffect(() => {
    if (!focusOnRender.current) return;
    focusOnRender.current = false;
    const key = focused.toDateString();
    rootRef.current?.querySelector<HTMLButtonElement>(`button[data-day="${key}"]`)?.focus();
  });

  const secondVisible = () => months === 2 && !!secondPanelRef.current && secondPanelRef.current.offsetParent !== null;
  const lastVisibleMonth = () => (secondVisible() ? addMonths(month, 1) : month);

  function moveFocus(next: Date) {
    const target = clampDay(next, min, max);
    if (compareDay(target, startOfMonth(month)) < 0) onMonthChange(startOfMonth(target));
    else if (compareDay(target, addMonths(startOfMonth(lastVisibleMonth()), 1)) >= 0)
      onMonthChange(startOfMonth(secondVisible() ? addMonths(target, -1) : target));
    setFocused(target);
    focusOnRender.current = true;
  }

  function onGridKeyDown(e: React.KeyboardEvent) {
    const offset = (focused.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -offset),
      End: () => addDays(focused, 6 - offset),
      PageUp: () => addMonths(focused, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    moveFocus(move());
  }

  // The day that keeps the tab stop: the focused day if it's visible, else the 1st of the month.
  const visibleMonths = months === 2 ? [month, addMonths(startOfMonth(month), 1)] : [month];
  const tabStopDay = visibleMonths.some((m) => isSameMonth(m, focused)) ? focused : startOfMonth(month);

  // Range band, including the hover preview while choosing the end date.
  let bandStart: Date | null = null;
  let bandEnd: Date | null = null;
  if (rangeStart && rangeEnd) {
    bandStart = rangeStart;
    bandEnd = rangeEnd;
  } else if (rangeStart && hover) {
    [bandStart, bandEnd] = compareDay(hover, rangeStart) < 0 ? [hover, rangeStart] : [rangeStart, hover];
  }
  const isRange = rangeStart !== undefined;

  const prevDisabled = !!min && compareDay(addDays(startOfMonth(month), -1), min) < 0;
  const nextDisabled = (lastMonth: Date) => !!max && compareDay(addMonths(startOfMonth(lastMonth), 1), max) > 0;

  if (view !== "days") {
    return (
      <div ref={rootRef} className="mx-auto w-full max-w-[22rem]">
        <MonthYearChooser
          view={view}
          month={month}
          min={min}
          max={max}
          onView={setView}
          onPick={(m) => {
            onMonthChange(m);
            setFocused(clampDay(m, min, max));
            setView("days");
          }}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="@container w-full min-w-0">
      <div className="relative grid grid-cols-1 gap-x-6 gap-y-4 @min-[34rem]:grid-cols-2">
        {visibleMonths.map((m, index) => {
          const isFirst = index === 0;
          const isLast = index === visibleMonths.length - 1;
          return (
            <div
              key={m.toISOString()}
              ref={index === 1 ? secondPanelRef : undefined}
              className={cn("mx-auto w-full min-w-0 max-w-[22rem]", index === 1 && "hidden @min-[34rem]:block")}
            >
              {/* Month header */}
              <div className="mb-2 flex h-9 items-center justify-between gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => onMonthChange(addMonths(startOfMonth(month), -1))}
                  disabled={prevDisabled}
                  className={cn(NAV_BUTTON, !isFirst && "invisible")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isFirst) onMonthChange(startOfMonth(addMonths(m, -1)));
                    setView("months");
                  }}
                  aria-label={`${formatMonthYear(m)}, choose month and year`}
                  className="min-w-0 cursor-pointer truncate rounded-lg px-2.5 py-1.5 font-display text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 dark:text-white dark:hover:bg-white/8"
                >
                  {formatMonthYear(m)}
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => onMonthChange(addMonths(startOfMonth(month), 1))}
                  disabled={nextDisabled(m)}
                  className={cn(
                    NAV_BUTTON,
                    // In 2-month mode the first panel's "next" only shows when the second panel is hidden.
                    !isLast && "@min-[34rem]:invisible",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7" aria-hidden="true">
                {weekdays.map((w) => (
                  <span
                    key={w.short}
                    className="pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  >
                    <span className="@min-[20rem]:hidden">{w.narrow}</span>
                    <span className="hidden @min-[20rem]:inline">{w.short.slice(0, 2)}</span>
                  </span>
                ))}
              </div>

              {/* Days */}
              <div role="grid" aria-label={formatMonthYear(m)} onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-y-1">
                {monthMatrix(m, weekStartsOn).map((day, i) => {
                  if (!isSameMonth(day, m)) return <span key={i} aria-hidden="true" className="aspect-square" />;

                  const disabled = isDayDisabled(day, min, max);
                  const isToday = isSameDay(day, today);
                  const isStart = isSameDay(day, bandStart);
                  const isEnd = isSameDay(day, bandEnd);
                  const isSelected = isSameDay(day, selected) || isSameDay(day, rangeStart) || isSameDay(day, rangeEnd);
                  const inBand =
                    !!bandStart && !!bandEnd && compareDay(day, bandStart) >= 0 && compareDay(day, bandEnd) <= 0 && !isSameDay(bandStart, bandEnd);
                  const col = i % 7;
                  const isMonthStart = day.getDate() === 1;
                  const isMonthEnd = isSameDay(day, new Date(m.getFullYear(), m.getMonth() + 1, 0));

                  return (
                    <div
                      key={i}
                      role="gridcell"
                      aria-selected={isSelected || undefined}
                      className={cn(
                        "relative flex aspect-square items-center justify-center",
                        inBand && "bg-brand-50 dark:bg-brand-400/12",
                        inBand && (isStart || col === 0 || isMonthStart) && "rounded-l-xl",
                        inBand && (isEnd || col === 6 || isMonthEnd) && "rounded-r-xl",
                      )}
                    >
                      <button
                        type="button"
                        data-day={day.toDateString()}
                        tabIndex={isSameDay(day, tabStopDay) ? 0 : -1}
                        disabled={disabled}
                        aria-label={formatLongDay(day)}
                        aria-current={isToday ? "date" : undefined}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setFocused(day);
                          onSelect(day);
                        }}
                        onFocus={() => setFocused(day)}
                        onMouseEnter={() => isRange && setHover(day)}
                        onMouseLeave={() => isRange && setHover(null)}
                        className={cn(
                          "relative grid h-full max-h-11 w-full max-w-11 cursor-pointer place-items-center rounded-xl text-sm tabular-nums transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:text-slate-300 disabled:line-through dark:focus-visible:ring-offset-ink-surface dark:disabled:text-slate-600",
                          isStart || isEnd || (isSelected && !inBand)
                            ? "bg-brand-600 font-bold text-white shadow-[0_8px_20px_-12px_rgba(45,106,79,0.9)] dark:bg-brand-400 dark:text-[#06130d]"
                            : inBand
                              ? "font-semibold text-brand-700 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-400/20"
                              : "font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/8",
                        )}
                      >
                        {day.getDate()}
                        {isToday && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                              isStart || isEnd || (isSelected && !inBand) ? "bg-white dark:bg-[#06130d]" : "bg-brand-500",
                            )}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Month / year chooser ───────────── */

function MonthYearChooser({
  view,
  month,
  min,
  max,
  onView,
  onPick,
}: {
  view: "months" | "years";
  month: Date;
  min?: Date | null;
  max?: Date | null;
  onView: (v: View) => void;
  onPick: (month: Date) => void;
}) {
  const [year, setYear] = useState(month.getFullYear());
  const decadeStart = year - (year % 12);
  const names = monthLabels();
  const now = new Date();

  const monthDisabled = (y: number, mi: number) =>
    (!!min && compareDay(new Date(y, mi + 1, 0), min) < 0) || (!!max && compareDay(new Date(y, mi, 1), max) > 0);
  const yearDisabled = (y: number) => (!!min && y < min.getFullYear()) || (!!max && y > max.getFullYear());

  const cell =
    "flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:cursor-not-allowed disabled:opacity-30";
  const idle = "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/8";
  const active = "bg-brand-600 text-white dark:bg-brand-400 dark:text-[#06130d]";
  const current = "ring-1 ring-inset ring-brand-300 dark:ring-brand-400/40";

  const step = view === "months" ? 1 : 12;
  return (
    <div>
      <div className="mb-3 flex h-9 items-center justify-between gap-1">
        <button
          type="button"
          aria-label={view === "months" ? "Previous year" : "Previous years"}
          onClick={() => setYear((y) => y - step)}
          className={NAV_BUTTON}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onView(view === "months" ? "years" : "days")}
          className="cursor-pointer rounded-lg px-2.5 py-1.5 font-display text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 dark:text-white dark:hover:bg-white/8"
        >
          {view === "months" ? year : `${decadeStart} – ${decadeStart + 11}`}
        </button>
        <button
          type="button"
          aria-label={view === "months" ? "Next year" : "Next years"}
          onClick={() => setYear((y) => y + step)}
          className={NAV_BUTTON}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {view === "months" ? (
        <div className="grid grid-cols-3 gap-2">
          {names.map((name, mi) => {
            const isActive = year === month.getFullYear() && mi === month.getMonth();
            const isNow = year === now.getFullYear() && mi === now.getMonth();
            return (
              <button
                key={name}
                type="button"
                disabled={monthDisabled(year, mi)}
                onClick={() => onPick(new Date(year, mi, 1))}
                className={cn(cell, isActive ? active : idle, !isActive && isNow && current)}
              >
                {name}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => decadeStart + i).map((y) => {
            const isActive = y === month.getFullYear();
            return (
              <button
                key={y}
                type="button"
                disabled={yearDisabled(y)}
                onClick={() => {
                  setYear(y);
                  onView("months");
                }}
                className={cn(cell, "tabular-nums", isActive ? active : idle, !isActive && y === now.getFullYear() && current)}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
