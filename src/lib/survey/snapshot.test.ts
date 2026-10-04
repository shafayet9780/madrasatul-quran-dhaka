import { describe, expect, it } from 'vitest';
import { classLabel, compareStudents, markFor, roundSnapshotSchema, type RoundSnapshot } from './snapshot';

const snapshot: RoundSnapshot = roundSnapshotSchema.parse({
  takenAt: '2026-10-04T00:00:00.000Z',
  template: {
    id: 'surveyTemplate.t1-v1',
    version: 1,
    kind: 'T1',
    title: 'স্টুডেন্ট সম্পর্কে শিক্ষকের রিভিউ',
    scale: [10, 8, 6, 4],
    questions: [
      { key: 'attendance', text: 'ক্লাসে নিয়মিত উপস্থিত হয় কি না?', type: 'marks', areaKey: 'attendance', required: true, allowNA: false },
      {
        key: 'study-hours',
        text: 'বাসায় নিয়মিত পড়া পড়ে কি না?',
        type: 'options',
        options: [
          { key: 'two-plus', label: '২ ঘন্টা +', mark: 10 },
          { key: 'one', label: '১ ঘন্টা', mark: 7 },
          { key: 'none', label: 'পড়ে না', mark: 4 },
        ],
        areaKey: 'focus-habits',
        required: true,
        allowNA: false,
      },
    ],
  },
  areas: [
    { key: 'attendance', name: 'উপস্থিতি', group: 'student' },
    { key: 'focus-habits', name: 'মনোযোগ ও পড়ার অভ্যাস', group: 'student' },
  ],
  classes: [
    { key: 'play', name: 'প্লে', sections: [], subjects: [] },
    { key: 'nursery', name: 'নার্সারি', sections: [{ key: 'a', name: 'A' }], subjects: [{ key: 'quran', name: 'কুরআন' }] },
  ],
  teachers: [{ key: 'teacher-1', name: 'উস্তাদ আব্দুল্লাহ' }],
});

describe('roundSnapshotSchema', () => {
  it('defaults options to an empty list', () => {
    expect(snapshot.template.questions[0].options).toEqual([]);
  });
  it('defaults required and allowNA when Sanity omits them', () => {
    expect(snapshot.template.questions[0]).toMatchObject({ required: true, allowNA: false });
    const loose = structuredClone(snapshot) as any;
    delete loose.template.questions[0].required;
    delete loose.template.questions[0].allowNA;
    expect(roundSnapshotSchema.parse(loose).template.questions[0]).toMatchObject({ required: true, allowNA: false });
  });
  it('rejects keys that are not lowercase slugs', () => {
    const bad = structuredClone(snapshot);
    bad.teachers[0].key = 'Teacher 1';
    expect(roundSnapshotSchema.safeParse(bad).success).toBe(false);
  });
});

describe('classLabel', () => {
  it('joins class and section names', () => {
    expect(classLabel(snapshot, 'nursery', 'a')).toBe('নার্সারি A');
    expect(classLabel(snapshot, 'play', '')).toBe('প্লে');
    expect(classLabel(snapshot, 'gone', '')).toBe('gone');
  });
});

describe('markFor', () => {
  const [marks, options] = snapshot.template.questions;
  it('accepts only marks on the scale', () => {
    expect(markFor(marks, snapshot.template.scale, 8)).toBe(8);
    expect(markFor(marks, snapshot.template.scale, 7)).toBeUndefined();
    expect(markFor(marks, snapshot.template.scale, 'na')).toBeUndefined();
  });
  it('resolves hidden option marks', () => {
    expect(markFor(options, snapshot.template.scale, 'one')).toBe(7);
    expect(markFor(options, snapshot.template.scale, 'other')).toBeUndefined();
  });
});

describe('compareStudents', () => {
  it('orders by roll, then students without a roll by name', () => {
    const list = [
      { erpId: '9', roll: null, name: 'zayd' },
      { erpId: '3', roll: 12, name: 'B' },
      { erpId: '7', roll: null, name: 'Amina' },
      { erpId: '1', roll: 2, name: 'C' },
    ];
    expect(list.sort(compareStudents).map((s) => s.erpId)).toEqual(['1', '3', '7', '9']);
  });
});
