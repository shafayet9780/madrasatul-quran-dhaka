import { describe, expect, it } from 'vitest';
import { guardianSheetHeader, guardianSheetRows, sheetStatus, t1SheetHeader, t1SheetRows } from './sheet-rows';
import { g1FixtureSnapshot, g2FixtureSnapshot } from './testing/guardian-fixture';
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
    expect(sheetStatus({ supersededBy: 'x', duplicateFlag: true, setAside: true })).toBe('set-aside');
    expect(sheetStatus({ supersededBy: null, duplicateFlag: true })).toBe('duplicate');
    expect(sheetStatus({ supersededBy: null, duplicateFlag: false })).toBe('current');
  });
});

describe('guardian sheet rows', () => {
  const submission = {
    id: '6f1d2a8e-3b4c-4d5e-8f90-1a2b3c4d5e6f',
    submittedAt: new Date('2026-10-12T09:30:00Z'),
    supersededBy: null,
    classKey: 'nursery',
    sectionKey: 'a',
    submitterName: 'রফিকুল ইসলাম',
    submitterRelation: 'পিতা',
    submitterMobile: '8801700000001',
    verified: true,
    comment: 'ভালো',
  };

  it('G2: one row with the chosen options, the N/A label and the guardian', () => {
    const snapshot = g2FixtureSnapshot();
    const header = guardianSheetHeader(snapshot);
    const [row] = guardianSheetRows(snapshot, submission, { studentErpId: '10012', studentName: 'MARYAM BINTE RAFIQ', roll: 2, answers: { attendance: 'above-90', 'study-at-home': 'na', devices: 'never', 'peer-complaints': 'often' } });
    expect(row).toHaveLength(header.length);
    expect(row.slice(2, 12)).toEqual(['বর্তমান', 'নার্সারি', 'A', 2, '10012', 'Maryam Binte Rafiq', 'রফিকুল ইসলাম', 'পিতা', '+8801700000001', 'যাচাইকৃত']);
    expect(row.slice(12)).toEqual(['উপস্থিতি > ৯০%', 'প্রযোজ্য নয় (ডে কেয়ার)', 'দেখে না', 'প্রায়ই আসে', 'ভালো']);
  });

  it('G1: one row per subject with its marks, marked as earlier once replaced', () => {
    const snapshot = g1FixtureSnapshot();
    const subjects = snapshot.classes.find((c) => c.key === 'nursery')!.subjects;
    const answers = Object.fromEntries(snapshot.template.questions.map((q, qi) => [q.key, Object.fromEntries(subjects.map((s, si) => [s.key, [10, 8, 6, 4][(qi + si) % 4]]))]));
    const rows = guardianSheetRows(snapshot, { ...submission, supersededBy: 'x', verified: false }, { studentErpId: '10012', studentName: 'Maryam', roll: null, answers });
    expect(rows).toHaveLength(subjects.length);
    expect(rows[0]).toHaveLength(guardianSheetHeader(snapshot).length);
    expect(rows[1].slice(2, 3)).toEqual(['পুরনো (সংশোধিত)']);
    expect(rows[1].slice(11, 16)).toEqual(['অযাচাইকৃত', subjects[1].name, 8, 6, 4]);
  });
});
