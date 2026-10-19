import { describe, expect, it } from 'vitest';
import { nameKey, parseDays, parseTimeRange, readRoster, readSheet } from './sheet-import';
import { SAMPLE_SHEET, sampleLookup } from './testing/sheet-sample';

describe('parseDays', () => {
  it('reads lists, ranges and "ex"', () => {
    expect(parseDays('sun, mon, tue')).toEqual([1, 2, 3]);
    expect(parseDays('wed,thu')).toEqual([4, 5]);
    expect(parseDays('sat-mon')).toEqual([0, 1, 2]);
    expect(parseDays('Sat - tue')).toEqual([0, 1, 2, 3]);
    expect(parseDays('ex tue')).toEqual([0, 1, 2, 4, 5]);
  });
  it('is null for anything else', () => {
    expect(parseDays('Extra support')).toBeNull();
    expect(parseDays('thu-sat')).toBeNull();
    expect(parseDays('')).toBeNull();
  });
});

describe('nameKey', () => {
  it('matches names whatever their spacing, case or Unicode form', () => {
    expect(nameKey('  দিয়া  ফেরদৌস ')).toBe(nameKey('দিয\u09BCা ফেরদৌস'));
    expect(nameKey('Taman  afz')).toBe(nameKey('Taman Afz'));
  });
});

describe('parseTimeRange', () => {
  it('reads 12-hour times without am/pm', () => {
    expect(parseTimeRange('7:00-8:15')).toEqual({ startsAt: 420, endsAt: 495 });
    expect(parseTimeRange('12:15-01:00')).toEqual({ startsAt: 735, endsAt: 780 });
    expect(parseTimeRange('3:00-8:00')).toEqual({ startsAt: 900, endsAt: 1200 });
    expect(parseTimeRange('Class Time')).toBeNull();
  });
});

describe('readSheet', () => {
  const plan = readSheet(SAMPLE_SHEET, sampleLookup);
  const at = (group: string, col: number) => plan.assignments.filter((a) => a.group === group && a.col === col).map(({ subject, days, teacher, ta, note }) => ({ subject, days, teacher, ta, note }));
  const problems = (cell: string) => plan.issues.filter((i) => i.cell === cell).map((i) => i.problem);
  const ALL = [0, 1, 2, 3, 4, 5];

  it('reads the periods and their blocks', () => {
    expect(plan.periods.map((p) => [p.startsAt, p.label])).toEqual([
      [420, 'হিফয'],
      [495, 'হিফয'],
      [540, 'কুরআন'],
      [600, 'আরবি'],
      [645, ''],
      [690, ''],
      [900, 'হিফয (বিকেল)'],
    ]);
  });

  it('reads the groups under their headings, levels with their band and classes with their room', () => {
    expect(plan.groups.map((g) => [g.name, g.section, g.band, g.room])).toEqual(
      expect.arrayContaining([
        ['hifz (m)', 'হিফয', '', ''],
        ['Qaida-A', 'কুরআন', '', ''],
        ['L-1 A', 'আরবি', 'LEVEL-1', ''],
        ['L-1 B', 'আরবি', 'LEVEL-1', ''],
        ['Nursery-A', 'জেনারেল', '', '402'],
        ['Nursery-B', 'জেনারেল', '', '402'],
      ]),
    );
    expect(plan.groups).toHaveLength(6);
  });

  it('puts a Hifz group in every period it is merged over, the second name as TA', () => {
    expect(at('hifz (m)', 1)).toEqual([{ subject: 'Hifz', days: ALL, teacher: 'Ruhul', ta: 'Hamid', note: '' }]);
    expect(at('hifz (m)', 2)).toEqual(at('hifz (m)', 1));
    expect(at('hifz (m)', 14)).toEqual([{ subject: 'Hifz', days: ALL, teacher: 'Ruhul', ta: null, note: '' }]);
    expect(problems('B7')).toEqual([expect.stringContaining('দুজন শিক্ষক')]);
    // Days beside a single teacher aren't a TA's days: noted, not guessed.
    expect(problems('O7')).toEqual([expect.stringContaining('বন্ধনীর লেখা ধরা হয়নি')]);
  });

  it('reads book lines as Arabic and splits the days', () => {
    expect(at('Qaida-A', 3)).toEqual([{ subject: 'Quran', days: ALL, teacher: 'Moin', ta: null, note: '' }]);
    expect(at('L-1 A', 7)).toEqual([
      { subject: 'Arabic', days: [1, 2, 3], teacher: 'Karim', ta: null, note: 'RA-1' },
      { subject: 'Islam', days: [4, 5], teacher: 'Karim', ta: null, note: '' },
    ]);
  });

  it('gives a TA with days only those days', () => {
    expect(at('Nursery-A', 11)).toEqual([
      { subject: 'Math', days: [2, 3, 4, 5], teacher: 'Tania', ta: 'Sadia', note: '' },
      { subject: 'Math', days: [0, 1], teacher: 'Tania', ta: null, note: '' },
    ]);
  });

  it('pairs teachers with subjects in order when their numbers match', () => {
    expect(at('Nursery-A', 12)).toEqual([
      { subject: 'Math', days: [0, 1, 2], teacher: 'Rina', ta: null, note: '' },
      { subject: 'Islam', days: [3, 4, 5], teacher: 'Salma', ta: null, note: '' },
    ]);
    expect(problems('M7')).toEqual([expect.stringContaining('ক্রম অনুযায়ী')]);
  });

  it('reads a teacher written after the subject, and "ex" days', () => {
    expect(at('Nursery-B', 11)).toEqual([{ subject: 'Bangla', days: [0, 1], teacher: 'Sadia', ta: null, note: '' }]);
    expect(at('Nursery-B', 12)).toEqual([{ subject: 'English', days: [0, 1, 2, 4, 5], teacher: 'Science-1', ta: null, note: '' }]);
  });

  it('puts what it cannot read on the fix list instead of guessing', () => {
    expect(at('L-1 B', 7)).toEqual([]);
    expect(problems('H11')).toEqual([expect.stringContaining('দুটি বিষয়')]);
    expect(problems('L11')).toEqual(expect.arrayContaining([expect.stringContaining('শিক্ষকের তালিকায় নেই')]));
    expect(plan.unknownNames).toEqual(['Ghost']);
    expect(plan.rooms).toEqual([{ name: '402', shared: true }]);
    expect(plan.issues.some((i) => i.text.includes('402') && i.problem.includes('শেয়ার'))).toBe(true);
  });

  it('reads the roster under "Free Teachers"', () => {
    expect(readRoster(SAMPLE_SHEET)).toEqual(['Moin', 'Ruhul', 'tania', 'Science-1']);
  });
});
