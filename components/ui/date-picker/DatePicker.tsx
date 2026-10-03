"use client";

import { useState } from "react";
import { Button } from "../primitives";
import { Calendar } from "./Calendar";
import { PickerDialog, PickerTrigger, PresetList, TimeField, type TimeValue } from "./parts";
import {
  FUTURE_DATE_PRESETS,
  clampDay,
  formatDisplay,
  formatValue,
  isDayDisabled,
  isSameDay,
  parseValue,
  startOfDay,
  startOfMonth,
  withTime,
  type DatePreset,
  type PickerMode,
} from "./date-utils";

export type DatePickerProps = {
  /** "YYYY-MM-DD" (date) or "YYYY-MM-DDTHH:mm" (datetime), or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  mode?: PickerMode;
  /** Same format as `value`. In datetime mode the time part is enforced too. */
  min?: string;
  max?: string;
  placeholder?: string;
  /** Dialog heading, e.g. "Due date". */
  title?: string;
  /** Quick picks shown above the calendar. "future" = Today, Tomorrow, In 1 week… */
  presets?: DatePreset[] | "future";
  /** Time used when a day is picked before any time is set (datetime mode). */
  defaultTime?: TimeValue;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md";
  className?: string;
  weekStartsOn?: number;
  "aria-label"?: string;
};

/**
 * Single date (or date + time) picker. Opens a responsive calendar dialog;
 * in date mode picking a day applies immediately, in datetime mode the user
 * sets a time and confirms.
 */
export function DatePicker({
  value,
  onChange,
  mode = "date",
  min,
  max,
  placeholder,
  title,
  presets,
  defaultTime = { hours: 9, minutes: 0 },
  clearable = true,
  disabled,
  required,
  invalid,
  id,
  name,
  size,
  className,
  weekStartsOn = 1,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const current = parseValue(value);
  const minDate = parseValue(min);
  const maxDate = parseValue(max);
  const isDateTime = mode === "datetime";
  const presetList = presets === "future" ? FUTURE_DATE_PRESETS : presets ?? [];

  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<TimeValue>(defaultTime);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  function openPicker() {
    if (disabled) return;
    setDay(current ? startOfDay(current) : null);
    setTime(current ? { hours: current.getHours(), minutes: current.getMinutes() } : defaultTime);
    setMonth(startOfMonth(current ?? clampDay(new Date(), minDate, maxDate)));
    setOpen(true);
  }

  /** Combine day + time and keep it inside min/max (time-aware in datetime mode). */
  function resolve(d: Date, t: TimeValue) {
    let result = isDateTime ? withTime(d, t) : startOfDay(d);
    if (isDateTime && minDate && result < minDate) result = minDate;
    if (isDateTime && maxDate && result > maxDate) result = maxDate;
    return result;
  }

  function commit(d: Date, t: TimeValue = time) {
    onChange(formatValue(resolve(d, t), mode));
    setOpen(false);
  }

  function pickDay(d: Date) {
    setDay(d);
    if (!isDateTime) commit(d);
  }

  const draft = day ? resolve(day, time) : null;
  const clamped = !!day && isDateTime && draft!.getTime() !== withTime(day, time).getTime();
  const activePreset = presetList.findIndex((p) => isSameDay(p.date(), day));

  return (
    <>
      <PickerTrigger
        id={id}
        name={name}
        value={value}
        display={formatDisplay(current, mode)}
        placeholder={placeholder ?? (isDateTime ? "Pick a date & time" : "Pick a date")}
        disabled={disabled}
        required={required}
        invalid={invalid}
        size={size}
        className={className}
        aria-label={ariaLabel}
        onOpen={openPicker}
        onClear={clearable && !required ? () => onChange("") : undefined}
      />

      <PickerDialog
        open={open}
        onOpenChange={setOpen}
        title={title ?? (isDateTime ? "Select date & time" : "Select a date")}
        summary={draft ? formatDisplay(draft, mode) : "No date selected"}
        footer={
          <>
            {clearable && !required && value && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-auto"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {isDateTime && (
              <Button size="sm" disabled={!day} onClick={() => day && commit(day)}>
                Apply
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {presetList.length > 0 && (
            <PresetList
              items={presetList.map((p) => p.label)}
              activeIndex={activePreset}
              onPick={(i) => {
                const d = clampDay(presetList[i].date(), minDate, maxDate);
                if (isDayDisabled(d, minDate, maxDate)) return;
                setMonth(startOfMonth(d));
                pickDay(d);
              }}
            />
          )}

          <Calendar
            month={month}
            onMonthChange={setMonth}
            selected={day}
            onSelect={pickDay}
            min={minDate}
            max={maxDate}
            weekStartsOn={weekStartsOn}
          />

          {isDateTime && (
            <div className="border-t border-slate-100 pt-4 dark:border-ink-line">
              <TimeField label="Time" value={time} onChange={setTime} />
              {clamped && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Adjusted to the {minDate && draft! <= minDate ? "earliest" : "latest"} allowed time.
                </p>
              )}
            </div>
          )}
        </div>
      </PickerDialog>
    </>
  );
}
