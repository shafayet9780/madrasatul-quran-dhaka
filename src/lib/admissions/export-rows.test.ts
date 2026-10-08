import { describe, expect, it } from 'vitest';
import { dhakaTime, exportHeader, exportRow, type ExportApplication } from './export-rows';
import { sampleSnapshot } from './testing/fixtures';

const app: ExportApplication = {
  publicRef: 'KG-017',
  status: 'interview',
  locale: 'bengali',
  primaryMobile: '8801712345678',
  email: 'a@b.co',
  studentNameBn: 'আব্দুল্লাহ',
  studentNameEn: 'Abdullah',
  dateOfBirth: '2021-03-12',
  answers: {
    student_photo: { key: 'admissions/x/p', name: 'p.jpg', size: 1, type: 'image/jpeg' },
    class_applied: 'kg',
    father_occupation: 'other',
    father_prayer_location: ['mosque'],
    father_smoking: 'no',
    mother_mobile: '০১৮১২-৩৪৫৬৭৮',
    children_count: '2',
  },
  createdAt: new Date('2026-09-29T02:05:00Z'),
  submittedAt: null,
  paidAt: new Date('2026-09-29T14:42:00Z'),
  attendedAt: null,
  evalFeeReceivedAt: null,
};

describe('export rows', () => {
  it('has one column per form field after the fixed columns, aligned with the header', () => {
    const s = sampleSnapshot();
    const header = exportHeader(s);
    const row = exportRow(s, app, { amount: 500, tranId: 'MQ27-1', bankTranId: 'B1', cardType: 'BKASH-BKash' });
    expect(row).toHaveLength(header.length);
    const at = (name: string) => row[header.indexOf(name)];
    expect(at('আবেদন আইডি')).toBe('KG-017');
    expect(at('অভিভাবকের মোবাইল')).toBe('01712345678');
    expect(at('অবস্থা')).toBe('মূল্যায়ন নির্ধারিত');
    expect(at('পরিশোধের সময়')).toBe('2026-09-29 20:42');
    expect(at('শিক্ষার্থীর ছবি')).toBe('আছে');
    expect(at('ধূমপানের অভ্যাস আছে?')).toBe('না');
    expect(at('মোবাইল (মাতা)')).toBe('01812345678');
    expect(at('সন্তান সংখ্যা')).toBe('2');
    expect(at('ফেসবুক আইডি')).toBe('');
    // Role answers shown in the fixed columns are not repeated.
    expect(header).not.toContain('নাম (বাংলায়)');
    expect(header.filter((h) => h === 'ইমেইল')).toHaveLength(1);
  });

  it('formats times in Dhaka', () => {
    expect(dhakaTime(new Date('2026-12-31T19:30:00Z'))).toBe('2027-01-01 01:30');
    expect(dhakaTime(null)).toBe('');
  });
});
