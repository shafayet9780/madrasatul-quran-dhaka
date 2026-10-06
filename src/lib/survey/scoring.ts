export const MARK_FLOOR = 4;
export const MARK_TOP = 10;
/** A mark of ৭ or less is a "low" answer: ৪/৬ on the mark scale, the lower options in G2 (owner, 2026-10-06). */
export const MARK_LOW = 7;

/**
 * Hidden marks for descriptive options, evenly spaced from 10 down to 4:
 * 3 → 10/7/4 · 4 → 10/8/6/4 · 5 → 10/8.5/7/5.5/4.
 */
export function spacedMarks(count: number): number[] {
  if (!Number.isInteger(count) || count < 2) throw new Error(`Need at least 2 options, got ${count}`);
  const step = (MARK_TOP - MARK_FLOOR) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round((MARK_TOP - i * step) * 10) / 10);
}
