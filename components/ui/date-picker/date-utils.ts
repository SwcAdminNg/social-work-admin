// Date helpers for the picker. Values are exchanged as the same strings the
// native inputs used, so forms keep their existing state and serialization:
//   date      → "YYYY-MM-DD"
//   datetime  → "YYYY-MM-DDTHH:mm" (local time)

export type PickerMode = "date" | "datetime";

export const LOCALE = "en-NG";

const pad = (n: number) => String(n).padStart(2, "0");

/** Midnight (local) of the given date. */
export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

/** Adds months, clamping the day so 31 Jan + 1 month → 28/29 Feb. */
export function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, d.getHours(), d.getMinutes());
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameDay(a?: Date | null, b?: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Compare calendar days only (ignores time). */
export function compareDay(a: Date, b: Date) {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function clampDay(d: Date, min?: Date | null, max?: Date | null) {
  if (min && compareDay(d, min) < 0) return startOfDay(min);
  if (max && compareDay(d, max) > 0) return startOfDay(max);
  return d;
}

export function isDayDisabled(d: Date, min?: Date | null, max?: Date | null) {
  return (!!min && compareDay(d, min) < 0) || (!!max && compareDay(d, max) > 0);
}

/** Parse a "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" string as local time. */
export function parseValue(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Accept a min/max given as a value string or a Date. */
export function toBound(bound?: string | Date | null): Date | null {
  if (!bound) return null;
  return bound instanceof Date ? bound : parseValue(bound);
}

export function formatValue(d: Date | null, mode: PickerMode): string {
  if (!d) return "";
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return mode === "datetime" ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}

/** ISO/UTC timestamp from the API → "YYYY-MM-DDTHH:mm" in the viewer's local time. */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : formatValue(d, "datetime");
}

/** Combine the calendar day of `day` with the clock time of `time`. */
export function withTime(day: Date, time: { hours: number; minutes: number }) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.hours, time.minutes);
}

/* ───────────── Display ───────────── */

const fmtDay = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });
const fmtDayNoYear = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
const fmtWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true });
const fmtMonthYear = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" });
const fmtLongDay = new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatMonthYear = (d: Date) => fmtMonthYear.format(d);
export const formatLongDay = (d: Date) => fmtLongDay.format(d);
export const formatTime = (d: Date) => fmtTime.format(d);

export function formatDisplay(d: Date | null, mode: PickerMode) {
  if (!d) return "";
  return mode === "datetime" ? `${fmtDay.format(d)}, ${fmtTime.format(d)}` : fmtWeekday.format(d);
}

export function formatRangeDisplay(start: Date | null, end: Date | null, mode: PickerMode) {
  if (!start) return "";
  if (mode === "datetime") {
    const s = `${fmtDay.format(start)}, ${fmtTime.format(start)}`;
    return end ? `${s} – ${fmtDay.format(end)}, ${fmtTime.format(end)}` : `From ${s}`;
  }
  if (!end) return `From ${fmtDay.format(start)}`;
  if (isSameDay(start, end)) return fmtDay.format(start);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${sameYear ? fmtDayNoYear.format(start) : fmtDay.format(start)} – ${fmtDay.format(end)}`;
}

/** Weekday headers starting on `weekStartsOn` (0 = Sunday). */
export function weekdayLabels(weekStartsOn: number) {
  const fmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short" });
  const fmtNarrow = new Intl.DateTimeFormat(LOCALE, { weekday: "narrow" });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + ((i + weekStartsOn) % 7));
    return { short: fmt.format(d), narrow: fmtNarrow.format(d) };
  });
}

export function monthLabels() {
  const fmt = new Intl.DateTimeFormat(LOCALE, { month: "short" });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2023, i, 1)));
}

/** Always 6 rows × 7 days so the grid height never jumps between months. */
export function monthMatrix(month: Date, weekStartsOn: number): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/* ───────────── Presets ───────────── */

export type RangePreset = { label: string; range: () => [Date, Date] };
export type DatePreset = { label: string; date: () => Date };

export const PAST_RANGE_PRESETS: RangePreset[] = [
  { label: "Today", range: () => [startOfDay(new Date()), startOfDay(new Date())] },
  { label: "Yesterday", range: () => [addDays(startOfDay(new Date()), -1), addDays(startOfDay(new Date()), -1)] },
  { label: "Last 7 days", range: () => [addDays(startOfDay(new Date()), -6), startOfDay(new Date())] },
  { label: "Last 30 days", range: () => [addDays(startOfDay(new Date()), -29), startOfDay(new Date())] },
  { label: "This month", range: () => [startOfMonth(new Date()), startOfDay(new Date())] },
  {
    label: "Last month",
    range: () => {
      const prev = addMonths(startOfMonth(new Date()), -1);
      return [prev, endOfMonth(prev)];
    },
  },
  { label: "This year", range: () => [new Date(new Date().getFullYear(), 0, 1), startOfDay(new Date())] },
];

export const FUTURE_RANGE_PRESETS: RangePreset[] = [
  { label: "Next 7 days", range: () => [startOfDay(new Date()), addDays(startOfDay(new Date()), 6)] },
  { label: "Next 30 days", range: () => [startOfDay(new Date()), addDays(startOfDay(new Date()), 29)] },
  { label: "Next 3 months", range: () => [startOfDay(new Date()), addDays(addMonths(startOfDay(new Date()), 3), -1)] },
  {
    label: "Next month",
    range: () => {
      const next = addMonths(startOfMonth(new Date()), 1);
      return [next, endOfMonth(next)];
    },
  },
  { label: "Rest of the year", range: () => [startOfDay(new Date()), new Date(new Date().getFullYear(), 11, 31)] },
];

export const FUTURE_DATE_PRESETS: DatePreset[] = [
  { label: "Today", date: () => startOfDay(new Date()) },
  { label: "Tomorrow", date: () => addDays(startOfDay(new Date()), 1) },
  { label: "In 3 days", date: () => addDays(startOfDay(new Date()), 3) },
  { label: "In 1 week", date: () => addDays(startOfDay(new Date()), 7) },
  { label: "In 2 weeks", date: () => addDays(startOfDay(new Date()), 14) },
  { label: "In 1 month", date: () => addMonths(startOfDay(new Date()), 1) },
];
