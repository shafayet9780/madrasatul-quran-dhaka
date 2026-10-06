import { describe, expect, it } from 'vitest';
import { cellStats, childWeightedMean, cohortDelta, delta, pairedRound, perStudentMeans, questionDistributions, type GuardianItem } from './guardian-report-math';

const day = (d: number) => new Date(Date.UTC(2026, 9, d));
const round = (id: string, kind: string, opens: number, closes: number) => ({ id, kind, opensAt: day(opens), closesAt: day(closes) });

describe('pairedRound', () => {
  const t1 = round('t1', 'T1', 5, 20);
  it('takes the guardian round that overlaps the teacher round most', () => {
    const rounds = [round('a', 'G2', 1, 7), round('b', 'G2', 10, 25), round('c', 'G1', 6, 19)];
    expect(pairedRound(t1, rounds, 'G2')?.id).toBe('b');
    expect(pairedRound(t1, rounds, 'G1')?.id).toBe('c');
  });
  it('breaks ties by the nearest opening', () => {
    expect(pairedRound(t1, [round('far', 'G2', 1, 25), round('near', 'G2', 5, 29)], 'G2')?.id).toBe('near');
  });
  it('falls back to the nearest opening within 30 days, else none', () => {
    expect(pairedRound(t1, [round('later', 'G2', 22, 30)], 'G2')?.id).toBe('later');
    expect(pairedRound(round('t', 'T1', 1, 2), [round('g', 'G2', 28, 30)], 'G2')?.id).toBe('g');
    expect(pairedRound(round('t', 'T1', 1, 2), [round('g', 'G2', 32, 32)], 'G2')).toBeUndefined();
    expect(pairedRound(t1, [], 'G1')).toBeUndefined();
  });
});

const item = (studentErpId: string, mark: number | null, questionKey = 'q1'): GuardianItem => ({
  roundId: 'r',
  studentErpId,
  classKey: 'kg',
  sectionKey: 'a',
  subjectKey: 'math',
  questionKey,
  areaKey: 'assessment',
  mark,
});

describe('cellStats', () => {
  it('leaves N/A out of the mean and counts children, not answers', () => {
    const stats = cellStats([item('a', 10), item('a', 6), item('b', null), item('c', 8), item('d', 8)]);
    expect(stats.mean).toBe(8);
    expect(stats.respondents).toBe(3);
    expect(stats.topShare).toBeCloseTo(1 / 4);
    expect(stats.reliable).toBe(true);
    expect(cellStats([item('a', 10), item('b', 4)]).reliable).toBe(false);
  });
});

describe('questionDistributions', () => {
  it('counts each mark per question in scale order', () => {
    const [q1, q2] = questionDistributions([item('a', 10), item('b', 10), item('c', 4), item('a', 8, 'q2')], ['q1', 'q2'], [10, 8, 6, 4]);
    expect(q1.counts).toEqual([{ mark: 10, count: 2 }, { mark: 8, count: 0 }, { mark: 6, count: 0 }, { mark: 4, count: 1 }]);
    expect(q1.mean).toBe(8);
    expect(q2.n).toBe(1);
  });
});

describe('perStudentMeans and delta', () => {
  it('averages per child and rounds differences', () => {
    expect(Object.fromEntries(perStudentMeans([item('a', 10), item('a', 6), item('b', null)]))).toEqual({ a: 8 });
    expect(delta(7.84, 7.2)).toBe(0.6);
    expect(delta(null, 7)).toBeNull();
  });
});

describe('cohort and child weighting', () => {
  it('compares only children present in both rounds', () => {
    const now = new Map([['a', 8], ['b', 6], ['c', 10]]);
    const before = new Map([['a', 7], ['b', 7], ['d', 4]]);
    expect(cohortDelta(now, before)).toEqual({ delta: 0, cohort: 2 });
    expect(cohortDelta(now, new Map())).toEqual({ delta: null, cohort: 0 });
  });
  it('weighs every child once, however many subjects', () => {
    const many = ['s1', 's2', 's3'].map((s) => ({ ...item('a', 10), subjectKey: s }));
    expect(childWeightedMean([...many, item('b', 4)])).toBe(7);
  });
  it('does not count a child whose answers are all N/A', () => {
    expect(cellStats([item('a', null), item('b', 8)]).respondents).toBe(1);
  });
});
