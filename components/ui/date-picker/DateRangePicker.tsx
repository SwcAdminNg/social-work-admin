"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { Button, cn } from "../primitives";
import { Calendar } from "./Calendar";
import { PickerDialog, PickerTrigger, PresetList, TimeField, type TimeValue } from "./parts";
import {
  FUTURE_RANGE_PRESETS,
  PAST_RANGE_PRESETS,
  clampDay,
  compareDay,
  formatRangeDisplay,
  formatValue,
  isSameDay,
  parseValue,
  startOfDay,
  startOfMonth,
  toBound,
  withTime,
  type PickerMode,
  type RangePreset,
} from "./date-utils";

export type DateRangeValue = { start: string; end: string };

export type DateRangePickerProps = {
  /** "YYYY-MM-DD" (date) or "YYYY-MM-DDTHH:mm" (datetime); "" when unset. */
  start: string;
  end: string;
  onChange: (range: DateRangeValue) => void;
  mode?: PickerMode;
  min?: string | Date | null;
  max?: string | Date | null;
  placeholder?: string;
  title?: string;
  /** "past" for report/filter ranges, "future" for windows and schedules. */
  presets?: RangePreset[] | "past" | "future" | false;
  /** Require an end date before applying (otherwise "from X onwards" is allowed). */
  requireEnd?: boolean;
  startTimeLabel?: string;
  endTimeLabel?: string;
  defaultStartTime?: TimeValue;
  defaultEndTime?: TimeValue;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** true, or which end is invalid. */
  invalid?: boolean | "start" | "end";
  id?: string;
  size?: "sm" | "md";
  className?: string;
  weekStartsOn?: number;
  "aria-label"?: string;
};

const DAY_MS = 86_400_000;

/**
 * Date range picker. Shows two months side by side when there's room and one
 * on small screens, with optional presets and (in datetime mode) start/end times.
 */
export function DateRangePicker({
  start,
  end,
  onChange,
  mode = "date",
  min,
  max,
  placeholder,
  title,
  presets = "past",
  requireEnd = false,
  startTimeLabel = "Start time",
  endTimeLabel = "End time",
  defaultStartTime = { hours: 0, minutes: 0 },
  defaultEndTime = { hours: 23, minutes: 55 },
  clearable = true,
  disabled,
  required,
  invalid,
  id,
  size,
  className,
  weekStartsOn = 1,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const isDateTime = mode === "datetime";
  const currentStart = parseValue(start);
  const currentEnd = parseValue(end);
  const minDate = toBound(min);
  const maxDate = toBound(max);
  const presetList = presets === "past" ? PAST_RANGE_PRESETS : presets === "future" ? FUTURE_RANGE_PRESETS : presets || [];

  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [fromTime, setFromTime] = useState<TimeValue>(defaultStartTime);
  const [toTime, setToTime] = useState<TimeValue>(defaultEndTime);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  function openPicker() {
    if (disabled) return;
    setFrom(currentStart ? startOfDay(currentStart) : null);
    setTo(currentEnd ? startOfDay(currentEnd) : null);
    setFromTime(currentStart && isDateTime ? { hours: currentStart.getHours(), minutes: currentStart.getMinutes() } : defaultStartTime);
    setToTime(currentEnd && isDateTime ? { hours: currentEnd.getHours(), minutes: currentEnd.getMinutes() } : defaultEndTime);
    setMonth(startOfMonth(currentStart ?? clampDay(new Date(), minDate, maxDate)));
    setOpen(true);
  }

  function pickDay(day: Date) {
    if (!from || to) {
      setFrom(day);
      setTo(null);
    } else if (compareDay(day, from) < 0) {
      setTo(from);
      setFrom(day);
    } else {
      setTo(day);
    }
  }

  const draftStart = from ? (isDateTime ? withTime(from, fromTime) : from) : null;
  const draftEnd = to ? (isDateTime ? withTime(to, toTime) : to) : null;
  const timeError = !!draftStart && !!draftEnd && isDateTime && draftEnd <= draftStart ? "End time must be after the start time." : null;
  const boundsError =
    isDateTime && ((minDate && draftStart && draftStart < minDate) || (maxDate && draftEnd && draftEnd > maxDate))
      ? "The selected times are outside the allowed range."
      : null;
  const canApply = !!from && (!!to || !requireEnd) && !timeError && !boundsError;
  const dayCount = from && to ? Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS) + 1 : 0;
  const activePreset = presetList.findIndex((p) => {
    const [a, b] = p.range();
    return isSameDay(a, from) && isSameDay(b, to);
  });

  function apply() {
    if (!canApply) return;
    onChange({ start: formatValue(draftStart, mode), end: formatValue(draftEnd, mode) });
    setOpen(false);
  }

  const summary = from
    ? `${formatRangeDisplay(draftStart, draftEnd, mode)}${dayCount ? ` · ${dayCount} day${dayCount === 1 ? "" : "s"}` : ""}`
    : "Pick a start date";

  return (
    <>
      <PickerTrigger
        id={id}
        value={start || end ? `${start}/${end}` : ""}
        display={formatRangeDisplay(currentStart, currentEnd, mode)}
        placeholder={placeholder ?? "Any date"}
        icon={CalendarRange}
        disabled={disabled}
        required={required}
        invalid={!!invalid}
        size={size}
        className={className}
        aria-label={ariaLabel}
        onOpen={openPicker}
        onClear={clearable && !required ? () => onChange({ start: "", end: "" }) : undefined}
      />

      <PickerDialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title={title ?? "Select a date range"}
        summary={summary}
        footer={
          <>
            {(from || to) && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto"
                onClick={() => {
                  setFrom(null);
                  setTo(null);
                }}
              >
                Reset
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!canApply} onClick={apply}>
              Apply
            </Button>
          </>
        }
      >
        <div className="flex min-w-0 flex-col gap-4 @min-[44rem]:flex-row @min-[44rem]:gap-5">
          {presetList.length > 0 && (
            <aside className="min-w-0 @min-[44rem]:w-40 @min-[44rem]:flex-shrink-0 @min-[44rem]:border-r @min-[44rem]:border-slate-100 @min-[44rem]:pr-4 dark:@min-[44rem]:border-ink-line">
              <p className="mb-2 hidden text-[11px] font-semibold uppercase tracking-wider text-slate-400 @min-[44rem]:block dark:text-slate-500">
                Quick picks
              </p>
              <PresetList
                stackWhenWide
                items={presetList.map((p) => p.label)}
                activeIndex={activePreset}
                onPick={(i) => {
                  const [a, b] = presetList[i].range();
                  const s = clampDay(a, minDate, maxDate);
                  const e = clampDay(b, minDate, maxDate);
                  setFrom(s);
                  setTo(e);
                  setMonth(startOfMonth(s));
                }}
              />
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Start / end chips show which end the next click sets. */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Start", date: draftStart, active: !from || !!to },
                { label: "End", date: draftEnd, active: !!from && !to },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className={cn(
                    "min-w-0 rounded-xl border px-3 py-2 transition-colors",
                    slot.active
                      ? "border-brand-300 bg-brand-50/60 dark:border-brand-400/40 dark:bg-brand-400/[0.07]"
                      : "border-slate-200 dark:border-ink-line",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{slot.label}</p>
                  <p className={cn("truncate text-sm font-semibold", slot.date ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                    {slot.date ? formatRangeDisplay(slot.date, slot.date, "date") : slot.label === "End" && !requireEnd ? "Open-ended" : "—"}
                  </p>
                </div>
              ))}
            </div>

            <Calendar
              month={month}
              onMonthChange={setMonth}
              months={2}
              rangeStart={from}
              rangeEnd={to}
              onSelect={pickDay}
              min={minDate}
              max={maxDate}
              weekStartsOn={weekStartsOn}
            />

            {isDateTime && (
              <div className="grid gap-4 border-t border-slate-100 pt-4 @min-[30rem]:grid-cols-2 dark:border-ink-line">
                <TimeField label={startTimeLabel} value={fromTime} onChange={setFromTime} disabled={!from} />
                <TimeField label={endTimeLabel} value={toTime} onChange={setToTime} disabled={!to} />
              </div>
            )}

            {(timeError || boundsError) && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-300">
                {timeError ?? boundsError}
              </p>
            )}
          </div>
        </div>
      </PickerDialog>
    </>
  );
}
