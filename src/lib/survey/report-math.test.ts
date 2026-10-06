import { describe, expect, it } from 'vitest';
import { toBengaliDigits as bn } from './normalise';
import { areaMeans, childRows, dropSince, formatLow, formatMark, roundMeans, studentAggregates, studentAreaMeans, studentFlags, type MarkRow } from './report-math';

const row = (over: Partial<MarkRow>): MarkRow => ({
  roundId: 'r2',
  submissionId: 's',
  teacherKey: 't1',
  studentErpId: 'a',
  subjectKey: 'quran',
  questionKey: 'q1',
  areaKey: 'attendance',
  mark: 8,
  ...over,
});

const rows: MarkRow[] = [
  row({ mark: 10 }),
  row({ teacherKey: 't2', mark: 4 }),
  row({ teacherKey: 't3', mark: 4, areaKey: 'results' }),
  row({ studentErpId: 'b', mark: 6 }),
  row({ studentErpId: 'b', mark: 8, areaKey: 'results' }),
  row({ studentErpId: 'c', mark: 10 }),
  row({ roundId: 'r1', mark: 10 }),
  row({ roundId: 'r1', studentErpId: 'b', mark: 8 }),
];
const current = rows.filter((r) => r.roundId === 'r2');

describe('studentAggregates', () => {
  it('averages marks and counts teachers and lowest marks', () => {
    const agg = studentAggregates(current, 4);
    expect(agg.get('a')).toEqual({ erpId: 'a', mean: 6, n: 3, teachers: 3, lowQuestion: { questionKey: 'q1', teachers: 2 } });
    expect(agg.get('b')).toMatchObject({ mean: 7, teachers: 1, lowQuestion: null });
  });
});

describe('areaMeans', () => {
  it('averages per student first and greys areas with few students', () => {
    const [attendance, results] = areaMeans(current, ['attendance', 'results']);
    // a: (10+4)/2 = 7, b: 6, c: 10 → 7.67
    expect(attendance.mean).toBeCloseTo(7.667, 2);
    expect(attendance).toMatchObject({ students: 3, reliable: true });
    expect(results).toMatchObject({ mean: 6, students: 2, reliable: false });
  });
  it('gives one student’s area means', () => {
    expect(studentAreaMeans(current, 'a', ['attendance', 'results'])).toEqual([
      { areaKey: 'attendance', mean: 7, n: 2 },
      { areaKey: 'results', mean: 4, n: 1 },
    ]);
  });
});

describe('studentFlags', () => {
  const name = (key: string) => ({ q1: 'মনোযোগ' })[key] ?? key;
  it('flags a drop since last round and the question several teachers gave the lowest mark on', () => {
    const agg = studentAggregates(current, 4).get('a');
    expect(studentFlags(agg, 4, bn, 4, name).map((f) => f.label)).toEqual(['আগের রাউন্ড থেকে ৪.০ কমেছে', '২ জন শিক্ষক “মনোযোগ”-এ ৪ দিয়েছেন']);
    expect(studentFlags(studentAggregates(current, 4).get('b'), 0.5, bn, 4, name)).toEqual([]);
  });
  it('counts lowest marks per question, so two teachers on different questions do not flag', () => {
    const split = [row({ teacherKey: 't1', mark: 4, questionKey: 'q1' }), row({ teacherKey: 't2', mark: 4, questionKey: 'q2' })];
    expect(studentFlags(studentAggregates(split, 4).get('a'), null, bn, 4, name)).toEqual([]);
  });
});

describe('child-only marks and drops', () => {
  it('leaves the teachers\' guardian questions out of the child\'s marks', () => {
    expect(childRows([row({ areaKey: 'guardian-cooperation' }), row({})]).map((r) => r.areaKey)).toEqual(['attendance']);
  });
  it('compares only subjects rated in both rounds, against the latest earlier round with marks', () => {
    const drop = [
      row({ roundId: 'r1', subjectKey: 'quran', mark: 10 }),
      row({ roundId: 'r1', subjectKey: 'math', mark: 10 }),
      row({ roundId: 'r3', subjectKey: 'quran', mark: 8 }),
      row({ roundId: 'r3', subjectKey: 'arabic', mark: 4 }),
    ];
    // r2 has no marks for the child: compared with r1, on Quran only (Arabic was not rated in r1).
    expect(dropSince(drop, ['r1', 'r2', 'r3'], 'a')).toBe(2);
    expect(dropSince(drop, ['r3'], 'a')).toBeNull();
  });
  it('writes the share of low answers', () => {
    expect(formatLow(0.25, bn)).toBe('২৫% উত্তর ৭ বা কম');
    expect(formatLow(null, bn)).toBe('');
  });
});

describe('roundMeans', () => {
  it('gives a trend in round order, skipping rounds without marks', () => {
    expect(roundMeans(rows, [{ id: 'r1', label: 'সেপ্টে.' }, { id: 'r2', label: 'অক্টো.' }, { id: 'r3', label: 'নভে.' }], 'b')).toEqual([
      expect.objectContaining({ roundId: 'r1', mean: 8 }),
      expect.objectContaining({ roundId: 'r2', mean: 7 }),
    ]);
  });
});

describe('formatMark', () => {
  it('shows one decimal in Bengali', () => {
    expect(formatMark(7.666, bn)).toBe('৭.৭');
    expect(formatMark(null, bn)).toBe('—');
  });
});
