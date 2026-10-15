import { describe, expect, it } from 'vitest';
import { generalOf, level, planRows, quranOf, stageOf } from './plan';

describe('the class-by-class plan', () => {
  it('groups Nursery to Class 11 into the three stages', () => {
    expect(planRows().map((rows) => rows.map((r) => r.i))).toEqual([
      [0, 1, 2],
      [3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ]);
    expect([0, 3, 7, 12].map(stageOf)).toEqual([0, 1, 2, 2]);
  });

  it('names the levels as the books do', () => {
    expect([0, 1, 2, 9].map(level)).toEqual(['N', 'KG', '1', '8']);
  });

  it('has the Quran portion up to Class 5 only', () => {
    expect([0, 2, 3, 6, 7].map(quranOf)).toEqual(['qaida', 'nazera', 'hifz1', 'shunani', undefined]);
  });

  it('adds science in Class 5 and BGS in Class 6', () => {
    expect(generalOf(5)).toEqual(['bangla', 'english', 'maths']);
    expect(generalOf(6)).toEqual(['bangla', 'english', 'maths', 'science']);
    expect(generalOf(7)).toEqual(['bangla', 'english', 'maths', 'science', 'bgs']);
  });

  it('marks the hifz years limited and ends with Dakhil and Mutawassita', () => {
    const rows = planRows().flat();
    expect(rows.filter((r) => r.kind === 'class' && r.limited).map((r) => r.i)).toEqual([3, 4, 5, 6]);
    expect(rows.slice(10).map((r) => r.kind)).toEqual(['dakhil', 'dakhil', 'mutawassita']);
  });
});
