import { toBengaliDigits } from './normalise';

// All survey times are shown and entered in Asia/Dhaka (UTC+6, no daylight saving).
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

const dayMonth = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long' });
const dayOnly = new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric' });

function dhakaParts(date: Date) {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() };
}

/** Value for <input type="datetime-local">, in Dhaka time. */
export function toDhakaInput(date: Date): string {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 16);
}

/** Parses a datetime-local value entered in Dhaka time; null when malformed. */
export function fromDhakaInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "১–২০ অক্টোবর" within a month, otherwise "২৫ সেপ্টেম্বর – ৫ অক্টোবর". */
export function formatDateRange(start: Date, end: Date): string {
  const a = dhakaParts(start);
  const b = dhakaParts(end);
  if (a.year === b.year && a.month === b.month) return `${dayOnly.format(start)}–${dayMonth.format(end)}`;
  return `${dayMonth.format(start)} – ${dayMonth.format(end)}`;
}

function period(hour: number): string {
  if (hour >= 4 && hour < 12) return 'সকাল';
  if (hour >= 12 && hour < 16) return 'দুপুর';
  if (hour >= 16 && hour < 18) return 'বিকাল';
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা';
  return 'রাত';
}

/** "২০ অক্টোবর, রাত ১১:৫৯" */
export function formatDateTime(date: Date): string {
  const { hour, minute } = dhakaParts(date);
  const h12 = hour % 12 || 12;
  return `${dayMonth.format(date)}, ${period(hour)} ${toBengaliDigits(`${h12}:${String(minute).padStart(2, '0')}`)}`;
}

/** Sortable Dhaka time for spreadsheets: "2026-10-04 21:42". */
export function formatSheetTime(date: Date): string {
  return toDhakaInput(date).replace('T', ' ');
}
