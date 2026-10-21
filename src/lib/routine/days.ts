import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import type { TimeSpan } from './types';

// The school week is Saturday–Thursday (0–5); Friday has no classes.

export const DAYS = [0, 1, 2, 3, 4, 5] as const;
export const DAY_NAMES = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'];
export const DAY_SHORT = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ'];

/** "প্রতিদিন", a run as "শনি–সোম", otherwise "রবি, বুধ". */
export function daysText(days: readonly number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === DAYS.length) return 'প্রতিদিন';
  const runs: number[][] = [];
  for (const d of sorted) {
    const run = runs[runs.length - 1];
    if (run && d === run[run.length - 1] + 1) run.push(d);
    else runs.push([d]);
  }
  return runs.map((r) => (r.length >= 3 ? `${DAY_SHORT[r[0]]}–${DAY_SHORT[r[r.length - 1]]}` : r.map((d) => DAY_SHORT[d]).join(', '))).join(', ');
}

/** The school day of a YYYY-MM-DD date (0 = Saturday), or null for a Friday. */
export function dayOfDate(date: string): number | null {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday … 6 = Saturday
  return weekday === 5 ? null : (weekday + 1) % 7;
}

/** Today in Dhaka as YYYY-MM-DD. */
export function dhakaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(now);
}

/** Minutes after midnight in Dhaka now. */
export function dhakaMinutes(now = new Date()): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now).split(':').map(Number);
  return h * 60 + m;
}

/** Whether a time is running at this minute. */
export const runningAt = (span: TimeSpan, minutes: number) => minutes >= span.startsAt && minutes < span.endsAt;

/** Two times overlap (touching ends don't: 9:00–9:45 and 9:45–10:30 are fine). */
export const overlaps = (a: TimeSpan, b: TimeSpan) => a.startsAt < b.endsAt && b.startsAt < a.endsAt;

/** The distinct times among these, by start then end (the columns of the routine table). */
export function distinctTimes(spans: TimeSpan[]): TimeSpan[] {
  const seen = new Map<string, TimeSpan>();
  for (const s of spans) seen.set(`${s.startsAt}-${s.endsAt}`, { startsAt: s.startsAt, endsAt: s.endsAt });
  return [...seen.values()].sort((a, b) => a.startsAt - b.startsAt || a.endsAt - b.endsAt);
}

export const sameTime = (a: TimeSpan, b: TimeSpan) => a.startsAt === b.startsAt && a.endsAt === b.endsAt;

export function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** "১৮ অক্টোবর ২০২৬, রবিবার" */
export function dateText(date: string): string {
  const day = dayOfDate(date);
  const d = new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  return `${d}, ${day === null ? 'শুক্রবার' : DAY_NAMES[day]}`;
}

/** Clock time as the school writes it (12-hour, no am/pm): 780 → "১:০০". */
export function timeText(minutes: number): string {
  const h = Math.floor(minutes / 60) % 12 || 12;
  return bn(`${h}:${String(minutes % 60).padStart(2, '0')}`);
}

/** A time for a typed box, so it reads back the same: as the school writes it, or "১৯:০০" / "০৬:৩০" when that would be read otherwise. */
export function inputTime(minutes: number): string {
  const plain = timeText(minutes);
  if (parseTime(plain) === minutes) return plain;
  return bn(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
}

/** "৯:০০–৯:৪৫" */
export function spanText(s: TimeSpan): string {
  return `${timeText(s.startsAt)}–${timeText(s.endsAt)}`;
}

export const minutesOf = (s: TimeSpan) => s.endsAt - s.startsAt;

/**
 * A typed clock time → minutes, or null: "১০:৪৫", "10.45", "1045" or "০৮০০". The school writes
 * times without am/pm, so 1–6 o'clock are the afternoon; 13–23, and a leading zero ("০৬:৩০"), are
 * taken as typed.
 */
export function parseTime(value: string): number | null {
  const latin = value.trim().replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(latin) ?? /^(\d{1,2})(\d{2})$/.exec(latin);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (h >= 1 && h <= 6 && m[1].length === 1) h += 12;
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/**
 * A typed start and end → a time, or null. After an afternoon start, an end that reads earlier is
 * in the evening ("৩:০০"–"৮:০০" is 3–8 pm, as the school writes the evening Hifz).
 */
export function parseSpan(start: string, end: string): { startsAt: number; endsAt: number } | null {
  const startsAt = parseTime(start);
  let endsAt = parseTime(end);
  if (startsAt === null || endsAt === null) return null;
  if (endsAt <= startsAt && startsAt >= 720 && endsAt < 720) endsAt += 720;
  return endsAt > startsAt ? { startsAt, endsAt } : null;
}

/** 930 → "১৫ ঘণ্টা ৩০ মিনিট" */
export function durationText(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${bn(h)} ঘণ্টা`, m && `${bn(m)} মিনিট`].filter(Boolean).join(' ') || '০ মিনিট';
}
