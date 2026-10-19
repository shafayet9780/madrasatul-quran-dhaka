import { describe, expect, it } from 'vitest';
import { assignmentWarnings, clashText, findClashes, lookup, occupancy, overlappingPeriod } from './clash';
import { dayOfDate, daysText, parseTime, periodText, timeText } from './days';
import { atSchool, freeTeachers, sessionOf } from './free';
import { bandRuns, groupPeriods, sheetBlocks, sheetLayout } from './layout';
import { busiestDays, loadStatus, salaryPerPeriod, teacherLoads } from './load';
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
      teachers: [teacher('fariza', { subjectIds: ['english'] }), teacher('nayeem', { gender: 'male', subjectIds: ['math'] }), teacher('science-1', { gender: null, isVacancy: true, subjectIds: ['math'] })],
      subjects: [subject('math', 'Math'), subject('english')],
    });
    expect(assignmentWarnings(assignment({ groupId: 'two-m', periodId: 'p', teacherId: 'nayeem', taId: 'fariza' }), w)).toEqual(['two-m-এ শুধু পুরুষ টিচার পড়ান, কিন্তু fariza মহিলা।']);
    expect(assignmentWarnings(assignment({ groupId: 'two-m', periodId: 'p', teacherId: 'fariza' }), w)).toHaveLength(2);
    // An open post without a gender yet: no gender warning.
    expect(assignmentWarnings(assignment({ groupId: 'two-m', periodId: 'p', teacherId: 'science-1' }), w)).toEqual([]);
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
    expect(busiestDays(t)).toEqual({ days: [1], count: 3 });
    // A tie names every busiest day, not just the first.
    expect(busiestDays({ ...t, perDay: [2, 2, 2, 2, 2, 2] })).toEqual({ days: [0, 1, 2, 3, 4, 5], count: 2 });
    expect(busiestDays({ ...t, perDay: [0, 0, 0, 0, 0, 0] })).toBeNull();
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

  it('splits the day into sittings and knows who is at school in one', () => {
    const periods = [period('a', 420, 495), period('b', 495, 540), period('c', 645, 690), period('eve', 900, 1200)];
    expect([...sessionOf(periods, 'b')]).toEqual(['a', 'b']);
    expect([...sessionOf(periods, 'eve')]).toEqual(['eve']);
    // 9:00–9:45 to 10:00 is a 15-minute gap: the same sitting.
    expect([...sessionOf([period('p1', 540, 585), period('p2', 600, 645)], 'p2')]).toEqual(['p1', 'p2']);
    expect(atSchool(all, new Set(['p1', 'p2']), 'nasreen', 1)).toBe(true);
    expect(atSchool(all, new Set(['p1', 'p2']), 'dolon', 1)).toBe(false);
  });

  it('turns absences into the classes to cover', () => {
    expect(needsFor(1, [{ teacherId: 'mueen', periodIds: null }], all).map((n) => n.assignment.id)).toEqual([qaidaA.id]);
    expect(needsFor(0, [{ teacherId: 'mueen', periodIds: null }], all)).toEqual([]);
    expect(needsFor(1, [{ teacherId: 'nasreen', periodIds: ['p1'] }], all)).toEqual([]);
  });

  it('ranks subject teachers first, then the lightest day, then fewest proxies this month', () => {
    const need = { assignment: qaidaA, role: 'main' as const, absentId: 'mueen' };
    const base = { teachers, assignments: all, periods: [period('p1', 540, 585), period('p2', 600, 645)], day: 1, absences: [{ teacherId: 'mueen', periodIds: null }], proxies: [], monthCounts: new Map<string, number>(), group: group('qaida-a') };
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
    // Someone at school that sitting comes before someone with no class then, even with a busier day.
    const kamal = teacher('kamal', { subjectIds: ['english'] });
    const english = assignment({ groupId: 'one-a', periodId: 'p2', teacherId: 'kamal', subjectId: 'english' });
    expect(rankCandidates(need, { ...base, teachers: [...teachers, kamal], assignments: [...all, english] }).map((c) => [c.teacher.id, c.atSchool])).toEqual([
      ['nasreen', true],
      ['kamal', true],
      ['dolon', false],
    ]);
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

  it('puts a group on its own timetable into the block of the heading most classes are under', () => {
    const six = group('six-f');
    const blocks = sheetBlocks(periods, [...assignments, at('six-f', 'h2'), at('six-f', 'a')], [...groups, six]);
    expect(blocks.map((b) => [b.headings.join(), b.periods.map((p) => p.id).join(), b.groups.map((g) => g.id).join()])).toEqual([
      ['হিফয', 'h1,h2', 'hifz-m,six-f'],
      ['কুরআন', 'q', 'qaida-a'],
      ['আরবি', 'a', 'l1-a,l1-b,l2,six-f'],
      ['জেনারেল', 'g1,g2', 'nursery-a,nursery-b'],
      ['হিফয', 'pm', 'hifz-m'],
    ]);
  });

  it('gives one group\'s day: its heading\'s periods and its own, else all', () => {
    const ids = (g: ReturnType<typeof group>, list = assignments) => groupPeriods(periods, list, groups, g).map((p) => p.id).join();
    expect(ids(groups[0])).toBe('h1,h2,pm');
    // Nursery-A has a class only at g1, but its heading's other period is there to fill.
    expect(ids(groups[5])).toBe('g1,g2');
    expect(ids(group('nursery-c'))).toBe('g1,g2');
    // A group on its own times keeps its classes in other headings' blocks.
    expect(ids(groups[5], [...assignments, at('nursery-a', 'a')])).toBe('a,g1,g2');
    expect(ids(group('new', { section: 'নতুন' }))).toBe(periods.map((p) => p.id).join());
  });

  it('groups each run of one band', () => {
    const runs = bandRuns([{ band: 'LEVEL-1' }, { band: 'LEVEL-1' }, { band: '' }, { band: '' }, { band: 'LEVEL-2' }, { band: 'LEVEL-1' }]);
    expect(runs.map((r) => [r.band, r.groups.length])).toEqual([['LEVEL-1', 2], ['', 1], ['', 1], ['LEVEL-2', 1], ['LEVEL-1', 1]]);
  });

  it('lays the sheet out as columns: cards where the classes are the same in each period, a table otherwise', () => {
    const { lanes, strips } = sheetLayout(periods, assignments, groups);
    expect(lanes.map((l) => [l.headings[0], l.cards])).toEqual([['হিফয', true], ['কুরআন', true], ['আরবি', true], ['জেনারেল', false], ['হিফয', true]]);
    expect(strips).toEqual([]);
    // Hifz changes in its second period: a table from then on.
    const changed = assignments.map((a) => (a.groupId === 'hifz-m' && a.periodId === 'h2' ? { ...a, subjectId: 'quran' } : a));
    expect(sheetLayout(periods, changed, groups).lanes[0].cards).toBe(false);
    // …and so does a room of its own in one period.
    const moved = assignments.map((a) => (a.groupId === 'hifz-m' && a.periodId === 'h2' ? { ...a, roomId: 'hall' } : a));
    expect(sheetLayout(periods, moved, groups).lanes[0].cards).toBe(false);
  });

  it('gives a group on its own times a strip, and puts a group with no class yet in its heading', () => {
    const six = group('six-f');
    const play = group('play');
    const { lanes, strips } = sheetLayout(periods, [...assignments, at('six-f', 'h2'), at('six-f', 'a'), at('six-f', 'g1')], [...groups, six, play]);
    expect(strips.map((g) => g.id)).toEqual(['six-f']);
    expect(lanes.map((l) => l.groups.map((g) => g.id).join())).toEqual(['hifz-m', 'qaida-a', 'l1-a,l1-b,l2', 'nursery-a,nursery-b,play', 'hifz-m']);
    // A group in just one other block (Play at 10:00) stays in that column.
    const one = sheetLayout(periods, [...assignments, at('play', 'a')], [...groups, play]);
    expect([one.strips, one.lanes[2].groups.map((g) => g.id)]).toEqual([[], ['l1-a', 'l1-b', 'l2', 'play']]);
  });
});
