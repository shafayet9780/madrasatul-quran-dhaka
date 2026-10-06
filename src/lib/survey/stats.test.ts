import { describe, expect, it } from 'vitest';
import { leniency, straightLining, summarise } from './stats';

describe('summarise', () => {
  it('reports n, mean, top share and distribution, excluding N/A', () => {
    const s = summarise([10, 8, null, 10, 6]);
    expect(s.n).toBe(4);
    expect(s.mean).toBe(8.5);
    expect(s.topShare).toBe(0.5);
    // ৭ or less is low: the ৬ here.
    expect(s.lowShare).toBe(0.25);
    // ৭ itself is low (G2 options such as "সপ্তাহে ২/১ বার"); ৮.৫ is not.
    expect(summarise([7, 8.5]).lowShare).toBe(0.5);
    expect([...s.distribution]).toEqual([[10, 2], [8, 1], [6, 1]]);
  });
  it('handles no answers', () => {
    expect(summarise([null])).toMatchObject({ n: 0, mean: null, topShare: null });
  });
});

describe('straightLining', () => {
  const same = (students: number, mark = 10) => Array.from({ length: students }, () => Array(7).fill(mark));

  it('flags ≥ 90% identical marks across ≥ 10 students', () => {
    const batch = same(10);
    batch[0] = [10, 10, 10, 10, 8, 8, 8]; // 67 of 70 marks are 10 → 95.7%
    expect(straightLining(batch)).toMatchObject({ flagged: true, students: 10, mark: 10 });
  });
  it('does not flag small classes', () => {
    expect(straightLining(same(9)).flagged).toBe(false);
  });
  it('does not flag varied marking', () => {
    const batch = same(12).map((row, i) => (i % 3 === 0 ? row.map(() => 6) : row));
    expect(straightLining(batch).flagged).toBe(false);
  });
});

describe('leniency', () => {
  it('is the paired mean difference against colleagues on shared students', () => {
    const result = leniency([
      // s1: A avg 10, B avg 8, C avg 6
      { teacherKey: 'a', studentId: 's1', mark: 10 },
      { teacherKey: 'b', studentId: 's1', mark: 8 },
      { teacherKey: 'c', studentId: 's1', mark: 6 },
      // s2: A 10/8 (avg 9), B 6
      { teacherKey: 'a', studentId: 's2', mark: 10 },
      { teacherKey: 'a', studentId: 's2', mark: 8 },
      { teacherKey: 'b', studentId: 's2', mark: 6 },
      // s3: only A — not paired
      { teacherKey: 'a', studentId: 's3', mark: 4 },
    ]);
    const byKey = Object.fromEntries(result.map((r) => [r.teacherKey, r]));
    // A: s1 10 − 7 = 3, s2 9 − 6 = 3
    expect(byKey.a).toEqual({ teacherKey: 'a', delta: 3, pairedStudents: 2 });
    // B: s1 8 − 8 = 0, s2 6 − 9 = −3
    expect(byKey.b).toEqual({ teacherKey: 'b', delta: -1.5, pairedStudents: 2 });
    // C: s1 6 − 9 = −3
    expect(byKey.c).toEqual({ teacherKey: 'c', delta: -3, pairedStudents: 1 });
  });
});
