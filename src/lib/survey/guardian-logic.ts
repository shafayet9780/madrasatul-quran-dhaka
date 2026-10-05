import type { LookupRequest } from './guardian-types';
import { normaliseMobile, normaliseStudentId } from './normalise';

/** The typed ID or mobile in the stored form, or null when it cannot match anything. */
export function lookupValue(by: LookupRequest['by'], input: string): string | null {
  if (by === 'mobile') return normaliseMobile(input);
  const id = normaliseStudentId(input);
  return /^[0-9A-Za-z]{1,20}$/.test(id) ? id : null;
}

/** What the lookup log keeps of a typed value: the last 4 characters only. */
export function inputTail(value: string): string {
  return value.slice(-4);
}

/**
 * Verified = the submitter's mobile is the student's father or mother mobile from the ERP.
 * `mobile` is already canonical (normaliseMobile once, where it was typed): normalising a foreign
 * number twice loses it, because the canonical form has no "+".
 */
export function isVerified(mobile: string | null, student: { fatherMobile: string | null; motherMobile: string | null }): boolean {
  return Boolean(mobile && (mobile === student.fatherMobile || mobile === student.motherMobile));
}
