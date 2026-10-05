import { describe, expect, it } from 'vitest';
import { toBengaliDigits as bn } from './normalise';
import { areaMeans, formatMark, roundMeans, studentAggregates, studentAreaMeans, studentFlags, type MarkRow } from './report-math';

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
    expect(agg.get('a')).toEqual({ erpId: 'a', mean: 6, n: 3, teachers: 3, lowTeachers: 2 });
    expect(agg.get('b')).toMatchObject({ mean: 7, teachers: 1, lowTeachers: 0 });
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
  it('flags a drop since last round and lowest marks from several teachers', () => {
    const agg = studentAggregates(current, 4).get('a');
    expect(studentFlags(agg, 10, bn).map((f) => f.label)).toEqual(['আগের রাউন্ড থেকে ৪.০ কমেছে', '২ জন শিক্ষক ৪ দিয়েছেন']);
    expect(studentFlags(studentAggregates(current, 4).get('b'), 7.5, bn)).toEqual([]);
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
