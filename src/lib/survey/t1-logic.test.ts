import { describe, expect, it } from 'vitest';
import { findMissing, hasMarks, resolveBatch, t1AnswerItems, validRowAnswers } from './t1-logic';
import { t1FixtureSnapshot } from './testing/t1-fixture';

const snapshot = t1FixtureSnapshot(new Date('2026-10-04T00:00:00Z'));
const key = { teacherKey: '90001', classKey: 'nursery', sectionKey: 'a', subjectKey: 'quran' };

describe('resolveBatch', () => {
  it('returns display names for a valid key', () => {
    expect(resolveBatch(snapshot, key)).toEqual({ teacherName: 'উস্তাদ আব্দুল্লাহ', subjectName: 'কুরআন' });
  });
  it('rejects unknown teachers, wrong sections and subjects', () => {
    expect(resolveBatch(snapshot, { ...key, teacherKey: 'nobody' })).toBeNull();
    expect(resolveBatch(snapshot, { ...key, sectionKey: '' })).toBeNull();
    expect(resolveBatch(snapshot, { ...key, classKey: 'play', sectionKey: 'a' })).toBeNull();
    expect(resolveBatch(snapshot, { ...key, classKey: 'play', sectionKey: '' })).not.toBeNull();
    expect(resolveBatch(snapshot, { ...key, subjectKey: 'history' })).toBeNull();
  });
});

describe('validRowAnswers', () => {
  it('accepts marks on the scale for known questions', () => {
    expect(validRowAnswers(snapshot, { studentErpId: 's1', answers: { attendance: 10, attention: 4 } })).toEqual({ attendance: 10, attention: 4 });
    expect(validRowAnswers(snapshot, { studentErpId: 's1' })).toEqual({});
  });
  it('keeps null as a withdrawn mark', () => {
    expect(validRowAnswers(snapshot, { studentErpId: 's1', answers: { attendance: null, attention: 6 } })).toEqual({ attendance: null, attention: 6 });
    expect(validRowAnswers(snapshot, { studentErpId: 's1', answers: { history: null } })).toBeNull();
  });
  it('rejects off-scale marks and unknown questions', () => {
    expect(validRowAnswers(snapshot, { studentErpId: 's1', answers: { attendance: 7 } })).toBeNull();
    expect(validRowAnswers(snapshot, { studentErpId: 's1', answers: { history: 10 } })).toBeNull();
  });
});

const roster = [
  { erpId: 's1', name: 'Ahmad', roll: 1 },
  { erpId: 's2', name: 'Maryam', roll: 2 },
];
const full = Object.fromEntries(snapshot.template.questions.map((q) => [q.key, 8]));

describe('findMissing', () => {
  it('lists students without a valid mark per question', () => {
    const answers = new Map<string, Record<string, unknown>>([
      ['s1', full],
      ['s2', { ...full, attention: undefined, 'assessment-80': 5 }],
    ]);
    expect(findMissing(snapshot, roster, answers)).toEqual([
      { questionKey: 'attention', students: [{ erpId: 's2', name: 'Maryam' }] },
      { questionKey: 'assessment-80', students: [{ erpId: 's2', name: 'Maryam' }] },
    ]);
  });
  it('is empty when every roster student is complete', () => {
    expect(findMissing(snapshot, roster, new Map([['s1', full], ['s2', full]]))).toEqual([]);
  });
  it('by level, counts only the students the teacher has started', () => {
    expect(findMissing(snapshot, roster, new Map([['s1', full]]), true)).toEqual([]);
    expect(findMissing(snapshot, roster, new Map([['s1', full]]))).toHaveLength(snapshot.template.questions.length);
    const partial = findMissing(snapshot, roster, new Map<string, Record<string, unknown>>([['s1', full], ['s2', { attendance: 10 }]]), true);
    expect(partial.every((m) => m.students.length === 1 && m.students[0].erpId === 's2')).toBe(true);
    expect(partial).toHaveLength(snapshot.template.questions.length - 1);
  });
});

describe('hasMarks', () => {
  it('is true once any question has a mark on the scale', () => {
    expect(hasMarks(snapshot, { attendance: 4 })).toBe(true);
    expect(hasMarks(snapshot, { attendance: 7 })).toBe(false);
    expect(hasMarks(snapshot, {})).toBe(false);
    expect(hasMarks(snapshot, undefined)).toBe(false);
  });
});

describe('t1AnswerItems', () => {
  it('writes one row per answered question with its area', () => {
    const items = t1AnswerItems(
      snapshot,
      { submissionId: 'sub', roundId: 'round', ...key },
      [{ id: 'r1', studentErpId: 's1', answers: { attendance: 10, 'peer-conduct': 4, stray: 8 } }]
    );
    expect(items).toEqual([
      expect.objectContaining({ questionKey: 'attendance', areaKey: 'attendance', mark: 10, kind: 'T1', responseId: 'r1', isNa: false }),
      expect.objectContaining({ questionKey: 'peer-conduct', areaKey: 'peer-conduct', mark: 4, subjectKey: 'quran' }),
    ]);
  });
});
