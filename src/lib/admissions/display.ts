import { toBengaliDigits } from '@/lib/survey/normalise';
import type { BiText } from './form-config';

// Formatting for the guardian pages and the PDF. Pure, safe in client components.

export type Locale = 'bengali' | 'english';

export function asLocale(value: string): Locale {
  return value === 'english' ? 'english' : 'bengali';
}

/** Sanity text in the page language, falling back to Bengali (many fields are Bengali only). */
export function txt(value: Partial<BiText> | undefined, locale: Locale): string {
  if (!value) return '';
  return (locale === 'english' && value.english?.trim()) || value.bengali || '';
}

export function num(value: number | string, locale: Locale): string {
  return locale === 'bengali' ? toBengaliDigits(value) : String(value);
}

export function taka(amount: number, locale: Locale): string {
  return `৳${num(amount.toLocaleString('en-US'), locale)}`;
}

const intlLocale = (locale: Locale) => (locale === 'bengali' ? 'bn-BD' : 'en-GB');

function bengaliDayPart(hour: number): string {
  if (hour >= 4 && hour < 6) return 'ভোর';
  if (hour >= 6 && hour < 12) return 'সকাল';
  if (hour >= 12 && hour < 15) return 'দুপুর';
  if (hour >= 15 && hour < 18) return 'বিকাল';
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা';
  return 'রাত';
}

/** "৩০ নভেম্বর, রাত ১১:৫৯" / "30 November, 11:59 pm" in Dhaka time. */
export function dateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' }).format(date);
  const parts = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Dhaka' }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')!.value);
  const minute = parts.find((p) => p.type === 'minute')!.value;
  const h12 = hour % 12 || 12;
  if (locale === 'bengali') return `${day}, ${bengaliDayPart(hour)} ${num(`${h12}:${minute}`, locale)}`;
  return `${day}, ${h12}:${minute} ${hour < 12 ? 'am' : 'pm'}`;
}

/** "12 March 2021" from a YYYY-MM-DD date of birth. */
export function longDate(isoDate: string, locale: Locale): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function fileSize(bytes: number, locale: Locale): string {
  const value = bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return num(value, locale);
}

/** Whole days until the deadline in Dhaka (0 on the last day), or null when it is far away or past. */
export function daysLeft(closesAt: string, now: Date = new Date()): number | null {
  const dhakaDay = (d: Date) => Math.floor((d.getTime() + 6 * 60 * 60 * 1000) / 86_400_000);
  const close = new Date(closesAt);
  if (close <= now) return null;
  const days = dhakaDay(close) - dhakaDay(now);
  return days <= 7 ? days : null;
}
