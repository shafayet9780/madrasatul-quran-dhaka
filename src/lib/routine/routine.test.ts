import { describe, expect, it } from 'vitest';
import { assignmentWarnings, clashText, findClashes, lookup, occupancy, overlappingPeriod } from './clash';
import { dayOfDate, daysText, parseTime, periodText, timeText } from './days';
import { freeTeachers } from './free';
import { bandSpans, sheetBlocks } from './layout';
import { busiestDay, loadStatus, salaryPerPeriod, teacherLoads } from './load';
import { needsFor, proxyDayText, rankCandidates } from './proxy';
import { assignment, group, period, room, subject, teacher } from './testing/sample';

describe('days and times', () => {
  it('names day sets the way the sheet does', () => {
    expect(daysText([0, 1, 2, 3, 4, 5])).toBe('প্রতিদিন');
    expect(daysText([1, 2, 3])).toBe('রবি–মঙ্গল');
    expect(daysText([4, 5])).toBe('বুধ, বৃহঃ');
    expect(daysText([3, 0, 1, 2, 5])).toBe('শনি–মঙ্গল, বৃহঃ');
  });

  it('maps dates to school days, Friday to none', () => {
    expect(dayOfDate('2026-10-17')).toBe(0); // Saturday
    expect(dayOfDate('2026-10-18')).toBe(1); // Sunday
    expect(dayOfDate('2026-10-22')).toBe(5); // Thursday
    expect(dayOfDate('2026-10-23')).toBeNull(); // Friday
  });

  it('writes clock times 12-hour without am/pm', () => {
    expect(timeText(7 * 60)).toBe('৭:০০');
    expect(timeText(13 * 60)).toBe('১:০০');
    expect(timeText(12 * 60 + 15)).toBe('১২:১৫');
    expect(periodText(period('p', 540, 585, 'কুরআন'))).toBe('৯:০০–৯:৪৫ · কুরআন');
    expect(parseTime('15:00')).toBe(900);
    expect(parseTime('25:00')).toBeNull();
  });
});

describe('clashes', () => {
  const groups = [group('nursery-a', { defaultRoomId: '402' }), group('kg-a', { defaultRoomId: '402' }), group('five-m', { defaultRoomId: 'hall' }), group('five-f', { defaultRoomId: 'hall' })];
  const rooms = [room('402'), room('501'), room('hall', true)];
  const names = lookup({ groups, rooms, teachers: [teacher('mueen'), teacher('rakib')], subjects: [subject('math')] });

  it('finds a teacher in two places only on shared days', () => {
    const other = assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'mueen', days: [0, 1, 2], roomId: '501' });
    const clashes = findClashes({ ...assignment({ groupId: 'kg-a', periodId: 'p1', teacherId: 'mueen', days: [2, 3] }), id: undefined }, [other], names.groups, names.rooms);
    expect(clashes.map((c) => [c.kind, c.days])).toEqual([['teacher', [2]]]);
    expect(clashText(clashes[0], names)).toBe('mueen সোম এই পিরিয়ডে nursery-a-তে আছেন।');
  });

  it('counts a TA as busy too', () => {
    const other = assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'rakib', taId: 'mueen', roomId: '501' });
    const clashes = findClashes(assignment({ groupId: 'kg-a', periodId: 'p1', teacherId: 'mueen' }), [other], names.groups, names.rooms);
    expect(clashes.map((c) => c.kind)).toEqual(['teacher']);
  });

  it('blocks a room through the default room, but not a shared one', () => {
    const a = assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'mueen' });
    expect(findClashes(assignment({ groupId: 'kg-a', periodId: 'p1', teacherId: 'rakib' }), [a], names.groups, names.rooms).map((c) => c.kind)).toEqual(['room']);
    const hall = assignment({ groupId: 'five-m', periodId: 'p1', teacherId: 'mueen' });
    expect(findClashes(assignment({ groupId: 'five-f', periodId: 'p1', teacherId: 'rakib' }), [hall], names.groups, names.rooms)).toEqual([]);
  });

  it('lets day-split rows of one cell sit side by side, and ignores the row being edited', () => {
    const sunTue = assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'mueen', days: [1, 2, 3] });
    expect(findClashes(assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'rakib', days: [4, 5] }), [sunTue], names.groups, names.rooms)).toEqual([]);
    expect(findClashes({ ...sunTue, days: [1, 2, 3, 4] }, [sunTue], names.groups, names.rooms)).toEqual([]);
    expect(findClashes(assignment({ groupId: 'nursery-a', periodId: 'p2', teacherId: 'mueen' }), [sunTue], names.groups, names.rooms)).toEqual([]);
  });

  it('lists one occupancy per day for group, teacher, TA and unshared room', () => {
    const occ = occupancy(assignment({ groupId: 'nursery-a', periodId: 'p1', teacherId: 'mueen', taId: 'rakib', days: [0] }), names.groups, names.rooms);
    expect(occ).toEqual([
      { kind: 'group', refId: 'nursery-a', day: 0 },
      { kind: 'teacher', refId: 'mueen', day: 0 },
      { kind: 'teacher', refId: 'rakib', day: 0 },
      { kind: 'room', refId: '402', day: 0 },
    ]);
  });

  it('warns about subjects and the gender rule', () => {
    const w = lookup({
      groups: [group('two-m', { genderRule: 'male' })],
      rooms: [],
      teachers: [teacher('fariza', { subjectIds: ['english'] }), teacher('nayeem', { gender: 'male', subjectIds: ['math'] })],
      subjects: [subject('math', 'Math'), subject('english')],
    });
    expect(assignmentWarnings(assignment({ groupId: 'two-m', periodId: 'p', teacherId: 'nayeem', taId: 'fariza' }), w)).toEqual(['two-m-এ শুধু পুরুষ শিক্ষক পড়ান; fariza মহিলা।']);
    expect(assignmentWarnings(assignment({ groupId: 'two-m', periodId: 'p', teacherId: 'fariza' }), w)).toHaveLength(2);
  });

  it('finds overlapping periods', () => {
    const periods = [period('a', 540, 585), period('b', 600, 645)];
    expect(overlappingPeriod({ startsAt: 580, endsAt: 600 }, periods)?.id).toBe('a');
    expect(overlappingPeriod({ startsAt: 585, endsAt: 600 }, periods)).toBeUndefined();
    expect(overlappingPeriod({ id: 'a', startsAt: 540, endsAt: 590 }, periods)).toBeUndefined();
  });
});

describe('load', () => {
  const periods = [period('hifz', 420, 495), period('p1', 540, 585), period('pm', 900, 1200)];

  it('counts periods, half-weight TA, minutes and the status', () => {
    const loads = teacherLoads(
      [{ id: 't', targetPeriods: 10 }],
      [
        assignment({ groupId: 'g', periodId: 'p1', teacherId: 't', days: [0, 1, 2] }),
        assignment({ groupId: 'g', periodId: 'pm', teacherId: 't', days: [1, 2, 3, 4] }),
        assignment({ groupId: 'h', periodId: 'hifz', teacherId: 'x', taId: 't', days: [0, 1] }),
      ],
      periods,
    );
    const t = loads.get('t')!;
    expect([t.main, t.ta, t.weighted]).toEqual([7, 2, 8]);
    expect(t.minutesMain).toBe(3 * 45 + 4 * 300);
    expect(t.minutesTa).toBe(2 * 75);
    expect(t.status).toBe('ok');
    expect(t.perDay).toEqual([2, 3, 2, 1, 1, 0]);
    expect(busiestDay(t)).toEqual({ day: 1, count: 3 });
  });

  it('puts the limits at under 80 % and over 100 %', () => {
    expect(loadStatus(15.5, 20).status).toBe('under');
    expect(loadStatus(16, 20).status).toBe('ok');
    expect(loadStatus(20, 20).status).toBe('ok');
    expect(loadStatus(20.5, 20).status).toBe('over');
    expect(loadStatus(5, null).status).toBe('none');
  });

  it('works out salary per period', () => {
    expect(salaryPerPeriod(20000, 20)).toBe(231);
    expect(salaryPerPeriod(20000, 0)).toBeNull();
    expect(salaryPerPeriod(null, 10)).toBeNull();
  });
});

describe('free teachers and proxies', () => {
  const teachers = [
    teacher('mueen', { gender: 'male', subjectIds: ['quran'] }),
    teacher('nasreen', { subjectIds: ['quran', 'islam'] }),
    teacher('dolon', { subjectIds: ['islam'] }),
    teacher('science-1', { isVacancy: true, subjectIds: ['quran'] }),
    teacher('old', { active: false, subjectIds: ['quran'] }),
    teacher('tanjila', { subjectIds: ['quran'] }),
  ];
  const qaidaA = assignment({ groupId: 'qaida-a', periodId: 'p1', teacherId: 'mueen', subjectId: 'quran', days: [1, 2, 3] });
  const qaidaB = assignment({ groupId: 'qaida-b', periodId: 'p1', teacherId: 'tanjila', subjectId: 'quran' });
  const islam = assignment({ groupId: 'two-f', periodId: 'p2', teacherId: 'nasreen', subjectId: 'islam' });
  const all = [qaidaA, qaidaB, islam];

  it('lists active, non-vacancy teachers free in the period', () => {
    expect(freeTeachers(teachers, all, 1, 'p1').map((t) => t.id)).toEqual(['dolon', 'nasreen']);
    expect(freeTeachers(teachers, all, 0, 'p1').map((t) => t.id)).toEqual(['dolon', 'mueen', 'nasreen']);
  });

  it('turns absences into the classes to cover', () => {
    expect(needsFor(1, [{ teacherId: 'mueen', periodIds: null }], all).map((n) => n.assignment.id)).toEqual([qaidaA.id]);
    expect(needsFor(0, [{ teacherId: 'mueen', periodIds: null }], all)).toEqual([]);
    expect(needsFor(1, [{ teacherId: 'nasreen', periodIds: ['p1'] }], all)).toEqual([]);
  });

  it('ranks subject teachers first, then the lightest day, then fewest proxies this month', () => {
    const need = { assignment: qaidaA, role: 'main' as const, absentId: 'mueen' };
    const base = { teachers, assignments: all, day: 1, absences: [{ teacherId: 'mueen', periodIds: null }], proxies: [], monthCounts: new Map<string, number>(), group: group('qaida-a') };
    // Nasreen teaches Quran but has a class that day; Dolon has none and doesn't teach Quran.
    expect(rankCandidates(need, base).map((c) => [c.teacher.id, c.canTeach, c.today])).toEqual([
      ['nasreen', true, 1],
      ['dolon', false, 0],
    ]);
    // A proxy in the same period elsewhere makes a teacher busy; the gender rule filters.
    const taken = [{ id: 'x', assignmentId: 'other', role: 'main' as const, periodId: 'p1', proxyTeacherId: 'nasreen' }];
    expect(rankCandidates(need, { ...base, proxies: taken }).map((c) => c.teacher.id)).toEqual(['dolon']);
    expect(rankCandidates(need, { ...base, group: group('qaida-a', { genderRule: 'male' }) })).toEqual([]);
    // The need's own proxy doesn't hide its teacher.
    const own = [{ id: 'y', assignmentId: qaidaA.id, role: 'main' as const, periodId: 'p1', proxyTeacherId: 'nasreen' }];
    expect(rankCandidates(need, { ...base, proxies: own })[0].teacher.id).toBe('nasreen');
    // …and its own proxy isn't counted against them for the month either.
    expect(rankCandidates(need, { ...base, proxies: own, monthCounts: new Map([['nasreen', 1]]) })[0].month).toBe(0);
  });

  it('writes the day for WhatsApp', () => {
    expect(proxyDayText('2026-10-18', [{ period: '৯:০০–৯:৪৫', group: 'Qaida-A', subject: 'Quran', absent: 'Mueen', proxy: 'Nasreen', role: 'main' }])).toBe(
      'প্রক্সি — ১৮ অক্টোবর, ২০২৬, রবিবার\n\n৯:০০–৯:৪৫ · Qaida-A (Quran): Mueen → Nasreen',
    );
  });
});

describe('sheet-style layout', () => {
  const groups = [
    group('hifz-m', { section: 'হিফয' }),
    group('qaida-a', { section: 'কুরআন' }),
    group('l1-a', { section: 'আরবি', band: 'LEVEL-1' }),
    group('l1-b', { section: 'আরবি', band: 'LEVEL-1' }),
    group('l2', { section: 'আরবি', band: 'LEVEL-2' }),
    group('nursery-a'),
    group('nursery-b'),
  ];
  const periods = [period('h1', 420, 495), period('h2', 495, 540), period('q', 540, 585), period('a', 600, 645), period('g1', 645, 690), period('empty', 690, 735), period('g2', 735, 780), period('pm', 900, 1200)];
  const at = (groupId: string, periodId: string) => assignment({ groupId, periodId, teacherId: 't' });
  const assignments = [
    at('hifz-m', 'h1'), at('hifz-m', 'h2'), at('hifz-m', 'pm'),
    at('qaida-a', 'q'),
    at('l1-a', 'a'), at('l1-b', 'a'), at('l2', 'a'),
    at('nursery-a', 'g1'), at('nursery-b', 'g2'),
  ];

  it('cuts the day into blocks by heading, in time order, skipping empty periods', () => {
    const blocks = sheetBlocks(periods, assignments, groups);
    expect(blocks.map((b) => [b.headings.join(), b.periods.map((p) => p.id).join(), b.groups.map((g) => g.id).join(), b.banded])).toEqual([
      ['হিফয', 'h1,h2', 'hifz-m', false],
      ['কুরআন', 'q', 'qaida-a', false],
      ['আরবি', 'a', 'l1-a,l1-b,l2', true],
      ['জেনারেল', 'g1,g2', 'nursery-a,nursery-b', false],
      ['হিফয', 'pm', 'hifz-m', false],
    ]);
  });

  it('spans each run of one band', () => {
    expect(bandSpans([{ band: 'LEVEL-1' }, { band: 'LEVEL-1' }, { band: '' }, { band: 'LEVEL-2' }, { band: 'LEVEL-1' }])).toEqual([2, 0, 1, 1, 1]);
  });
});
