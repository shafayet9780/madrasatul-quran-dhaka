import { describe, expect, it } from 'vitest';
import { classifyAnswer, classLabel, classSections, compareStudents, roundSnapshotSchema, t1PairCount, type RoundSnapshot } from './snapshot';
import { t1FixtureSnapshot } from './testing/t1-fixture';

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

describe('classifyAnswer', () => {
  const [marks, options] = snapshot.template.questions;
  const { scale } = snapshot.template;
  it('accepts only marks on the scale', () => {
    expect(classifyAnswer(marks, scale, 8)).toEqual({ kind: 'mark', mark: 8 });
    expect(classifyAnswer(marks, scale, 7)).toEqual({ kind: 'invalid' });
    expect(classifyAnswer(marks, scale, '8')).toEqual({ kind: 'invalid' });
  });
  it('resolves hidden option marks', () => {
    expect(classifyAnswer(options, scale, 'one')).toEqual({ kind: 'mark', mark: 7 });
    expect(classifyAnswer(options, scale, 'other')).toEqual({ kind: 'invalid' });
  });
  it('tells "not applicable" apart from an invalid value', () => {
    expect(classifyAnswer(marks, scale, 'na')).toEqual({ kind: 'invalid' });
    expect(classifyAnswer({ ...options, allowNA: true }, scale, 'na')).toEqual({ kind: 'na' });
    expect(classifyAnswer({ ...marks, allowNA: true }, scale, 'na')).toEqual({ kind: 'na' });
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

describe('T1 fixture', () => {
  it('is a valid snapshot with 13 class-sections and 65 class-subject pairs', () => {
    const fixture = roundSnapshotSchema.parse(t1FixtureSnapshot());
    expect(fixture.template.questions).toHaveLength(7);
    expect(classSections(fixture)).toHaveLength(13);
    expect(t1PairCount(fixture)).toBe(65);
  });
});
