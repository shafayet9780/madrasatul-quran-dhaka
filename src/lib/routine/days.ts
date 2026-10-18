import { toBengaliDigits as bn } from '@/lib/survey/normalise';
import type { Period } from './types';

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

export function periodTime(p: Pick<Period, 'startsAt' | 'endsAt'>): string {
  return `${timeText(p.startsAt)}–${timeText(p.endsAt)}`;
}

/** The time, and the label when there is one: "৯:০০–৯:৪৫ · কুরআন". */
export function periodText(p: Period): string {
  return p.label ? `${periodTime(p)} · ${p.label}` : periodTime(p);
}

export const minutesOf = (p: Pick<Period, 'startsAt' | 'endsAt'>) => p.endsAt - p.startsAt;

/** "HH:MM" (24-hour, as a time input gives it) → minutes, or null. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

export function timeInput(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export const sortPeriods = <P extends Pick<Period, 'startsAt'>>(periods: P[]) => [...periods].sort((a, b) => a.startsAt - b.startsAt);
