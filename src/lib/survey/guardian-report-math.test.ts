import { describe, expect, it } from 'vitest';
import { cellStats, childWeightedMean, cohortDelta, delta, gapFlag, pairedRound, perStudentMeans, questionDistributions, resolveRounds, roundHistory, score100, strengthsAndWork, type GuardianItem } from './guardian-report-math';

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

describe('resolveRounds', () => {
  const at = (id: string, kind: string, opens: number, closes: number) => ({ id, kind, opensAt: new Date(Date.UTC(2026, 9, opens)), closesAt: new Date(Date.UTC(2026, 9, closes)) });
  const t1Old = at('t1-old', 'T1', 1, 10);
  const t1 = at('t1', 'T1', 20, 30);
  const g2 = at('g2', 'G2', 12, 18);

  it('pairs by date and never compares a guardian round with itself', () => {
    // One G2 round between two teacher rounds pairs with both: the comparison drops it.
    const resolved = resolveRounds(t1, [t1Old, g2, t1], {});
    expect(resolved.g2?.id).toBe('g2');
    expect(resolved.compareT1?.id).toBe('t1-old');
    expect(resolved.cg2).toBeUndefined();
  });

  it('honours "no comparison" and a picked guardian round', () => {
    const resolved = resolveRounds(t1, [t1Old, g2, t1], { compare: 'none', g2: 'g2' });
    expect(resolved.compareT1).toBeUndefined();
    expect(resolved.g2?.id).toBe('g2');
  });
});

describe('guardian and teacher side by side', () => {
  const bn = (n: number | string) => String(n);
  it('scores ৪ as 0 and ১০ as 100, and flags gaps of 2 marks', () => {
    expect([score100(4), score100(7), score100(10)]).toEqual([0, 50, 100]);
    expect(gapFlag(9, 6.8, bn)).toEqual({ kind: 'gap', label: 'অভিভাবক–শিক্ষক পার্থক্য 37 পয়েন্ট' });
    // 1.98 marks shows as 33 points, so it is flagged like the number on screen says.
    expect(gapFlag(8, 6.02, bn)?.label).toBe('অভিভাবক–শিক্ষক পার্থক্য 33 পয়েন্ট');
    expect(gapFlag(8, 6.5, bn)).toBeNull();
    expect(gapFlag(null, 4, bn)).toBeNull();
  });
  it('praises an area only when every side gave ৮+, and lists any side below ৭ as work', () => {
    const result = strengthsAndWork([
      { name: 'a', guardian: 10, teacher: 8 },
      { name: 'b', guardian: null, teacher: 6 },
      { name: 'c', guardian: 7, teacher: 7.5 },
      { name: 'd', guardian: 4, teacher: 6 },
      { name: 'e', guardian: null, teacher: null },
      { name: 'gap', guardian: 10, teacher: 4.5 },
      { name: 'one side', guardian: 9, teacher: null },
    ]);
    expect(result).toEqual({ strengths: ['one side', 'a'], work: ['d', 'gap', 'b'] });
  });
});

describe('roundHistory', () => {
  const at = (id: string, kind: string, opens: number, closes: number) => ({ id, kind, opensAt: new Date(Date.UTC(2026, 9, opens)), closesAt: new Date(Date.UTC(2026, 9, closes)) });
  it('keeps the picked rounds for the current teacher round and never repeats a guardian round', () => {
    const old = at('t1-old', 'T1', 1, 10);
    const t1 = at('t1', 'T1', 20, 30);
    const g2 = at('g2', 'G2', 12, 18);
    const picked = at('g2-picked', 'G2', 2, 3);
    const rounds = [old, picked, g2, t1];
    expect(roundHistory(t1, rounds, { g2 }).map((p) => [p.t1.id, p.g2?.id])).toEqual([['t1-old', 'g2-picked'], ['t1', 'g2']]);
    // The shared G2 round goes with the later teacher round only.
    expect(roundHistory(t1, [old, g2, t1], { g2 }).map((p) => p.g2?.id)).toEqual([undefined, 'g2']);
  });
});
