import { describe, expect, it } from 'vitest';
import { formatDateRange, formatDateTime, fromDhakaInput, toDhakaInput } from './dates';

describe('Dhaka date inputs', () => {
  it('round-trips datetime-local values in Dhaka time', () => {
    const date = fromDhakaInput('2026-10-20T23:59')!;
    expect(date.toISOString()).toBe('2026-10-20T17:59:00.000Z');
    expect(toDhakaInput(date)).toBe('2026-10-20T23:59');
  });
  it('rejects malformed values', () => {
    expect(fromDhakaInput('2026-10-20')).toBeNull();
    expect(fromDhakaInput('2026-13-40T99:99')).toBeNull();
  });
});

describe('Bengali formatting', () => {
  it('formats ranges within and across months', () => {
    expect(formatDateRange(new Date('2026-09-30T20:00:00Z'), new Date('2026-10-20T17:59:00Z'))).toBe('১–২০ অক্টোবর');
    expect(formatDateRange(new Date('2026-09-25T02:00:00Z'), new Date('2026-10-05T17:59:00Z'))).toBe('২৫ সেপ্টেম্বর – ৫ অক্টোবর');
  });
  it('formats a time with a Bengali day period', () => {
    expect(formatDateTime(new Date('2026-10-20T17:59:00Z'))).toBe('২০ অক্টোবর, রাত ১১:৫৯');
    expect(formatDateTime(new Date('2026-11-01T02:00:00Z'))).toBe('১ নভেম্বর, সকাল ৮:০০');
  });
});
