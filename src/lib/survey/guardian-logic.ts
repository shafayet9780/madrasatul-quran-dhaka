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

/** Verified = the submitter's mobile is the student's father or mother mobile from the ERP. */
export function isVerified(submitterMobile: string | null | undefined, student: { fatherMobile: string | null; motherMobile: string | null }): boolean {
  const mobile = normaliseMobile(submitterMobile);
  return Boolean(mobile && (mobile === student.fatherMobile || mobile === student.motherMobile));
}
