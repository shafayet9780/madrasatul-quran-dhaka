import { describe, expect, it } from 'vitest';
import { dateTime, daysLeft, fileSize, longDate, taka, txt } from './display';

describe('display helpers', () => {
  it('formats money, dates and sizes for each language in Dhaka time', () => {
    expect(taka(500, 'bengali')).toBe('৳৫০০');
    expect(taka(1500, 'english')).toBe('৳1,500');
    expect(dateTime('2026-11-30T17:59:00Z', 'bengali')).toBe('৩০ নভেম্বর, রাত ১১:৫৯');
    expect(dateTime('2026-11-30T04:30:00Z', 'english')).toBe('30 November, 10:30 am');
    expect(longDate('2021-03-12', 'english')).toBe('12 March 2021');
    expect(fileSize(4.2 * 1024 * 1024, 'bengali')).toBe('৪.২ MB');
    expect(fileSize(180 * 1024, 'english')).toBe('180 KB');
    expect(txt({ bengali: 'নাম' }, 'english')).toBe('নাম');
  });

  it('counts down only in the last week, by Dhaka calendar days', () => {
    const now = new Date('2026-11-25T20:00:00Z'); // 26 Nov, 2 am in Dhaka
    expect(daysLeft('2026-11-30T17:59:00Z', now)).toBe(4);
    expect(daysLeft('2026-11-26T17:00:00Z', now)).toBe(0);
    expect(daysLeft('2026-12-30T17:59:00Z', now)).toBeNull();
    expect(daysLeft('2026-11-01T00:00:00Z', now)).toBeNull();
  });
});
