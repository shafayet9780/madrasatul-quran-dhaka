import { describe, expect, it } from 'vitest';
import { sheetStatus, t1SheetHeader, t1SheetRows } from './sheet-rows';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const snapshot = t1FixtureSnapshot();
const submission = {
  id: '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f',
  submittedAt: new Date('2026-10-04T15:42:00Z'),
  supersededBy: null,
  duplicateFlag: false,
  teacherName: 'উস্তাদ আব্দুল্লাহ',
  classKey: 'nursery',
  sectionKey: 'a',
  subjectName: 'কুরআন',
};

describe('sheet rows', () => {
  it('has one column per question after the student columns', () => {
    const header = t1SheetHeader(snapshot);
    expect(header.slice(0, 10)).toEqual(['জমার সময়', 'রেফারেন্স', 'অবস্থা', 'শিক্ষক', 'শ্রেণি', 'শাখা', 'বিষয়', 'রোল', 'শিক্ষার্থী ID', 'শিক্ষার্থী']);
    expect(header[10]).toBe('1. নিয়মিত উপস্থিতি');
    expect(header).toHaveLength(18);
  });

  it('writes one row per student in roll order with Dhaka time and numeric marks', () => {
    const rows = t1SheetRows(snapshot, submission, [
      { studentErpId: '102', studentName: 'ZAINAB AKTER', roll: null, answers: { attendance: 8 }, note: '=HYPERLINK("x")' },
      { studentErpId: '101', studentName: 'Ahmad', roll: 1, answers: { attendance: 10, attention: 6 }, note: null },
    ]);
    expect(rows[0].slice(0, 12)).toEqual(['2026-10-04 21:42', expect.stringMatching(/^\d{4} \d{4}$/), 'বর্তমান', 'উস্তাদ আব্দুল্লাহ', 'নার্সারি', 'A', 'কুরআন', 1, '101', 'Ahmad', 10, 6]);
    expect(rows[1][9]).toBe('Zainab Akter');
    expect(rows[1][7]).toBe('');
    // Written RAW by the mirror, so a note that looks like a formula stays text, unchanged.
    expect(rows[1][17]).toBe('=HYPERLINK("x")');
  });

  it('labels superseded and duplicate submissions', () => {
    expect(sheetStatus({ supersededBy: 'x', duplicateFlag: true })).toBe('superseded');
    expect(sheetStatus({ supersededBy: null, duplicateFlag: true })).toBe('duplicate');
    expect(sheetStatus({ supersededBy: null, duplicateFlag: false })).toBe('current');
  });
});
