import type { FormOption } from './form-config';
import { num, type Locale } from './display';

export type Age = { years: number; months: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date in `YYYY-MM-DD`, or null. */
export function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return { y, m, d };
}

/** Ages are counted at the start of the session year (1 January), as the class age ranges are. */
export function sessionStart(session: string): string {
  const year = /^\d{4}/.exec(session)?.[0] ?? String(new Date().getUTCFullYear() + 1);
  return `${year}-01-01`;
}

/** Completed years and months on `on`, or null when either date is invalid or birth is later. */
export function ageOn(dateOfBirth: string, on: string): Age | null {
  const b = parseIsoDate(dateOfBirth);
  const r = parseIsoDate(on);
  if (!b || !r) return null;
  let months = (r.y - b.y) * 12 + (r.m - b.m);
  if (r.d < b.d) months -= 1;
  if (months < 0) return null;
  return { years: Math.floor(months / 12), months: months % 12 };
}

/**
 * Class options whose age range contains the age (whole years at session start). Options with no
 * range never match. Used for the "fits the child's age" hint, never to block an application.
 */
export function classesForAge(options: FormOption[], age: Age | null): string[] {
  if (!age) return [];
  return options
    .filter((o) => o.ageMin != null || o.ageMax != null)
    .filter((o) => (o.ageMin == null || age.years >= o.ageMin) && (o.ageMax == null || age.years < o.ageMax))
    .map((o) => o.value);
}

/** "১ জানুয়ারি ২০২৭" / "1 January 2027": the day ages are counted on. */
export function ageDateText(session: string, locale: Locale): string {
  const year = sessionStart(session).slice(0, 4);
  return locale === 'bengali' ? `১ জানুয়ারি ${num(year, locale)}` : `1 January ${year}`;
}

/** The age at the session start from a date of birth answer, or null. */
export function sessionAge(dateOfBirth: unknown, session: string): Age | null {
  return typeof dateOfBirth === 'string' ? ageOn(dateOfBirth, sessionStart(session)) : null;
}

/** "৭ বছর ৯ মাস" / "7 years 9 months". */
export function ageText(age: Age, locale: Locale): string {
  return locale === 'bengali' ? `${num(age.years, locale)} বছর ${num(age.months, locale)} মাস` : `${age.years} years ${age.months} months`;
}

/** The age on 1 January of the session as text ("৫ বছর ৯ মাস"), or '' when the date of birth is missing or invalid. */
export function sessionAgeText(dateOfBirth: unknown, session: string, locale: Locale): string {
  const age = sessionAge(dateOfBirth, session);
  return age ? ageText(age, locale) : '';
}
