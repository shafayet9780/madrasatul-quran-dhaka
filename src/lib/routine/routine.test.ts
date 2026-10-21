import { describe, expect, it } from 'vitest';
import { assignmentWarnings, clashText, findClashes, hostProblem, lookup, occupancy } from './clash';
import { dayOfDate, daysText, distinctTimes, inputTime, overlaps, parseSpan, parseTime, spanText, timeText } from './days';
import { atSchool, busyTeachers, sittingOf } from './free';
import { cellLessons, groupSections, tableSections } from './layout';
import { busiestDays, loadStatus, salaryPerPeriod, teacherLoads } from './load';
import { needsFor, proxyDayText, rankCandidates } from './proxy';
import { assignment, group, subject, teacher, TYPES } from './testing/sample';

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
    expect(spanText({ startsAt: 540, endsAt: 585 })).toBe('৯:০০–৯:৪৫');
  });

  it('reads typed times in Bengali or English digits, 1–6 o\'clock as the afternoon', () => {
    expect(parseTime('১০:৪৫')).toBe(645);
    expect(parseTime('10.45')).toBe(645);
    expect(parseTime('0800')).toBe(480);
    expect(parseTime('৩:০০')).toBe(900);
    expect(parseTime('12:15')).toBe(735);
    expect(parseTime('15:00')).toBe(900);
    expect(parseTime('7:00')).toBe(420);
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime('nine')).toBeNull();
    // An end before the start is the afternoon: the evening Hifz is written 3:00–8:00.
    expect(parseSpan('৩:০০', '৮:০০')).toEqual({ startsAt: 900, endsAt: 1200 });
    expect(parseSpan('১১:৩০', '১২:১৫')).toEqual({ startsAt: 690, endsAt: 735 });
    expect(parseSpan('১০:০০', '৯:০০')).toBeNull();
    expect(parseSpan('৯:০০', '')).toBeNull();
    // A leading zero is taken as typed (the morning); the boxes write evening times so they read back.
    expect(parseTime('০৬:৩০')).toBe(390);
    expect(parseTime('0600')).toBe(360);
    for (const m of [390, 420, 540, 780, 1140, 1200]) expect(parseTime(inputTime(m))).toBe(m);
    expect(inputTime(1140)).toBe('১৯:০০');
  });

  it('lists the distinct times in order and tells overlaps from touching ends', () => {
    const times = distinctTimes([
      { startsAt: 540, endsAt: 600 },
      { startsAt: 540, endsAt: 585 },
      { startsAt: 420, endsAt: 495 },
      { startsAt: 540, endsAt: 585 },
    ]);
    expect(times).toEqual([
      { startsAt: 420, endsAt: 495 },
      { startsAt: 540, endsAt: 585 },
      { startsAt: 540, endsAt: 600 },
    ]);
    expect(overlaps({ startsAt: 540, endsAt: 585 }, { startsAt: 585, endsAt: 630 })).toBe(false);
    expect(overlaps({ startsAt: 540, endsAt: 600 }, { startsAt: 585, endsAt: 630 })).toBe(true);
  });
});

describe('clashes', () => {
  const groups = [group('nursery-a'), group('one-a'), group('qaida-a', { typeId: 'quran' }), group('hifz-1', { typeId: 'hifz', genderRule: 'male' })];
  const teachers = [teacher('mueen', { gender: 'male', subjectIds: ['qaida'] }), teacher('nasreen'), teacher('dolon')];
  const names = lookup({ types: TYPES, groups, teachers, subjects: [subject('math'), subject('qaida', 'quran')] });
  const qaida = assignment({ groupId: 'qaida-a', hostGroupId: 'nursery-a', teacherId: 'mueen', subjectId: 'qaida', days: [0, 1, 2] });

  it('finds a teacher at overlapping times only on shared days', () => {
    // Six (F)'s own 9:00–10:00 runs into Quran's 9:00–9:45.
    const own = assignment({ groupId: 'one-a', teacherId: 'mueen', startsAt: 540, endsAt: 600, days: [2, 3] });
    expect(findClashes(own, [qaida]).map((c) => [c.kind, c.days])).toEqual([['teacher', [2]]]);
    expect(findClashes({ ...own, days: [3, 4] }, [qaida])).toEqual([]);
    // Back to back is fine.
    expect(findClashes({ ...own, startsAt: 585, endsAt: 630 }, [qaida])).toEqual([]);
  });

  it('counts a TA as busy too', () => {
    const other = assignment({ groupId: 'one-a', teacherId: 'nasreen', taId: 'mueen', days: [0] });
    expect(findClashes(other, [qaida]).map((c) => c.kind)).toEqual(['teacher']);
  });

  it('blocks a class lesson in the room a group sits in, once, and the group in two rooms', () => {
    const math = assignment({ groupId: 'nursery-a', teacherId: 'nasreen', startsAt: 570, endsAt: 615, days: [1] });
    const clashes = findClashes(math, [qaida]);
    expect(clashes.map((c) => [c.kind, c.refId])).toEqual([['room', 'nursery-a']]);
    expect(clashText(clashes[0], names)).toBe('nursery-a-এর রুমে রবি ৯:০০–৯:৪৫-এ qaida-a চলে।');
    // The class's own second lesson at that time is a group clash only, not also a room one.
    const again = assignment({ groupId: 'nursery-a', teacherId: 'dolon', days: [1] });
    expect(findClashes(again, [math]).map((c) => c.kind)).toEqual(['group']);
    // Qaida-A can't also be in One-A's room then.
    const moved = assignment({ groupId: 'qaida-a', hostGroupId: 'one-a', teacherId: 'dolon', days: [0] });
    expect(findClashes(moved, [qaida]).map((c) => c.kind)).toEqual(['group']);
  });

  it('lets day-split rows of one cell sit side by side, and ignores the row being edited', () => {
    const rest = assignment({ groupId: 'qaida-a', hostGroupId: 'nursery-a', teacherId: 'nasreen', subjectId: 'qaida', days: [3, 4, 5] });
    expect(findClashes(rest, [qaida])).toEqual([]);
    expect(findClashes(qaida, [qaida])).toEqual([]);
  });

  it('lists one occupancy per day for the group, its room row, teacher and TA', () => {
    const occ = occupancy({ ...qaida, days: [0], taId: 'dolon' });
    expect(occ).toEqual([
      { kind: 'group', refId: 'qaida-a', day: 0 },
      { kind: 'room', refId: 'nursery-a', day: 0 },
      { kind: 'teacher', refId: 'mueen', day: 0 },
      { kind: 'teacher', refId: 'dolon', day: 0 },
    ]);
  });

  it('wants a host class for a seated group and none for the rest', () => {
    expect(hostProblem(qaida, names)).toBeNull();
    expect(hostProblem({ ...qaida, hostGroupId: null }, names)).toBe('কোন ক্লাসের রুমে বসে, সেটা সিলেক্ট করুন।');
    expect(hostProblem({ ...qaida, hostGroupId: 'hifz-1' }, names)).toBe('গ্রুপ শুধু কোনো ক্লাসের রুমে বসতে পারে।');
    expect(hostProblem({ groupId: 'hifz-1', hostGroupId: null }, names)).toBeNull();
    expect(hostProblem({ groupId: 'one-a', hostGroupId: 'nursery-a' }, names)).toBe('এই ক্লাস বা গ্রুপ নিজের রুমে বসে।');
  });

  it('warns about subjects and the gender rule', () => {
    expect(assignmentWarnings(qaida, names)).toEqual([]);
    expect(assignmentWarnings({ ...qaida, teacherId: 'nasreen' }, names)).toEqual(['nasreen-এর সাবজেক্টের লিস্টে qaida নেই।']);
    expect(assignmentWarnings(assignment({ groupId: 'hifz-1', teacherId: 'mueen', taId: 'dolon', subjectId: 'qaida' }), names)).toEqual(['hifz-1-এ শুধু পুরুষ টিচার পড়ান, কিন্তু dolon মহিলা।']);
  });
});

describe('load', () => {
  it('counts lessons, half-weight TA, minutes and the status', () => {
    const loads = teacherLoads(
      [{ id: 't', targetPeriods: 10 }],
      [
        assignment({ groupId: 'g', teacherId: 't', days: [0, 1, 2] }),
        assignment({ groupId: 'g', teacherId: 't', startsAt: 900, endsAt: 1200, days: [1, 2, 3, 4] }),
        assignment({ groupId: 'h', teacherId: 'x', taId: 't', startsAt: 420, endsAt: 495, days: [0, 1] }),
      ],
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
  const qaidaA = assignment({ groupId: 'qaida-a', hostGroupId: 'nursery-a', teacherId: 'mueen', subjectId: 'quran', days: [1, 2, 3] });
  const qaidaB = assignment({ groupId: 'qaida-b', hostGroupId: 'nursery-b', teacherId: 'tanjila', subjectId: 'quran' });
  const islam = assignment({ groupId: 'two-f', teacherId: 'nasreen', subjectId: 'islam', startsAt: 600, endsAt: 645 });
  const all = [qaidaA, qaidaB, islam];
  const p1 = { startsAt: 540, endsAt: 585 };

  it('knows who is busy at an overlapping time', () => {
    expect([...busyTeachers(all, 1, p1)].sort()).toEqual(['mueen', 'tanjila']);
    expect([...busyTeachers(all, 1, { startsAt: 570, endsAt: 615 })].sort()).toEqual(['mueen', 'nasreen', 'tanjila']);
    expect([...busyTeachers(all, 0, p1)]).toEqual(['tanjila']);
  });

  it('splits the day into sittings and knows who is at school in one', () => {
    const spans = [
      { startsAt: 420, endsAt: 495 },
      { startsAt: 495, endsAt: 540 },
      { startsAt: 645, endsAt: 690 },
      { startsAt: 900, endsAt: 1200 },
    ];
    expect(sittingOf(spans, { startsAt: 495, endsAt: 540 })).toEqual({ startsAt: 420, endsAt: 540 });
    expect(sittingOf(spans, { startsAt: 900, endsAt: 1200 })).toEqual({ startsAt: 900, endsAt: 1200 });
    // 9:00–9:45 to 10:00 is a 15-minute gap: the same sitting.
    expect(sittingOf([p1, { startsAt: 600, endsAt: 645 }], { startsAt: 600, endsAt: 645 })).toEqual({ startsAt: 540, endsAt: 645 });
    expect(atSchool(all, { startsAt: 540, endsAt: 645 }, 'nasreen', 1)).toBe(true);
    expect(atSchool(all, { startsAt: 540, endsAt: 645 }, 'dolon', 1)).toBe(false);
  });

  it('turns absences into the lessons to cover', () => {
    expect(needsFor(1, [{ teacherId: 'mueen', times: null }], all).map((n) => n.assignment.id)).toEqual([qaidaA.id]);
    expect(needsFor(0, [{ teacherId: 'mueen', times: null }], all)).toEqual([]);
    expect(needsFor(1, [{ teacherId: 'nasreen', times: [p1] }], all)).toEqual([]);
    expect(needsFor(1, [{ teacherId: 'nasreen', times: [{ startsAt: 630, endsAt: 700 }] }], all).map((n) => n.assignment.id)).toEqual([islam.id]);
  });

  it('ranks subject teachers first, then those at school, the lightest day, then fewest proxies this month', () => {
    const need = { assignment: qaidaA, role: 'main' as const, absentId: 'mueen' };
    const base = { teachers, assignments: all, day: 1, absences: [{ teacherId: 'mueen', times: null }], proxies: [], monthCounts: new Map<string, number>(), group: group('qaida-a') };
    // Nasreen teaches Quran but has a lesson that day; Dolon has none and doesn't teach Quran.
    expect(rankCandidates(need, base).map((c) => [c.teacher.id, c.canTeach, c.today])).toEqual([
      ['nasreen', true, 1],
      ['dolon', false, 0],
    ]);
    // A proxy at an overlapping time elsewhere makes a teacher busy; the gender rule filters.
    const taken = [{ id: 'x', assignmentId: 'other', role: 'main' as const, startsAt: 570, endsAt: 615, proxyTeacherId: 'nasreen' }];
    expect(rankCandidates(need, { ...base, proxies: taken }).map((c) => c.teacher.id)).toEqual(['dolon']);
    expect(rankCandidates(need, { ...base, group: group('qaida-a', { genderRule: 'male' }) })).toEqual([]);
    // The need's own proxy doesn't hide its teacher.
    const own = [{ id: 'y', assignmentId: qaidaA.id, role: 'main' as const, startsAt: 540, endsAt: 585, proxyTeacherId: 'nasreen' }];
    expect(rankCandidates(need, { ...base, proxies: own })[0].teacher.id).toBe('nasreen');
    // Someone at school that sitting comes before someone with no lesson then, even with a busier day.
    const kamal = teacher('kamal', { subjectIds: ['english'] });
    const english = assignment({ groupId: 'one-a', teacherId: 'kamal', subjectId: 'english', startsAt: 600, endsAt: 645 });
    expect(rankCandidates(need, { ...base, teachers: [...teachers, kamal], assignments: [...all, english] }).map((c) => [c.teacher.id, c.atSchool])).toEqual([
      ['nasreen', true],
      ['kamal', true],
      ['dolon', false],
    ]);
    // …and its own proxy isn't counted against them for the month either.
    expect(rankCandidates(need, { ...base, proxies: own, monthCounts: new Map([['nasreen', 1]]) })[0].month).toBe(0);
  });

  it('writes the day for WhatsApp', () => {
    expect(proxyDayText('2026-10-18', [{ time: '৯:০০–৯:৪৫', group: 'Qaida-A', subject: 'Quran', absent: 'Mueen', proxy: 'Nasreen', role: 'main' }])).toBe(
      'প্রক্সি — ১৮ অক্টোবর, ২০২৬, রবিবার\n\n৯:০০–৯:৪৫ · Qaida-A (Quran): Mueen → Nasreen',
    );
  });
});

describe('routine table layout', () => {
  const groups = [
    group('two-m', { sort: 2 }),
    group('nursery-a', { sort: 1 }),
    group('hifz-1-m', { typeId: 'hifz', genderRule: 'male' }),
    group('najera-1-f', { typeId: 'najera', genderRule: 'female' }),
    group('hifz-1-f', { typeId: 'hifz', genderRule: 'female' }),
    group('qaida-a', { typeId: 'quran' }),
    group('l-1-a', { typeId: 'arabic' }),
    group('old', { active: false }),
  ];
  const qaida = assignment({ groupId: 'qaida-a', hostGroupId: 'nursery-a', teacherId: 'mueen', days: [2, 3] });
  const qaidaLate = assignment({ groupId: 'qaida-a', hostGroupId: 'two-m', teacherId: 'mueen', startsAt: 660, endsAt: 705 });
  const math = assignment({ groupId: 'nursery-a', teacherId: 'jamila', days: [0, 1] });

  it('puts own-room groups first by gender, then the classes; seated groups have no rows of their own', () => {
    expect(tableSections(TYPES, groups, []).map((s) => [s.title, s.groups.map((g) => g.id)])).toEqual([
      ['হিফয · নাজেরা (M)', ['hifz-1-m']],
      ['হিফয · নাজেরা (F)', ['hifz-1-f', 'najera-1-f']],
      ['ক্লাস', ['nursery-a', 'two-m']],
    ]);
  });

  it('lists every type in the group view: own-room, seated, then classes', () => {
    expect(groupSections(TYPES, groups, []).map((s) => [s.title, s.groups.map((g) => g.id)])).toEqual([
      ['হিফয গ্রুপ', ['hifz-1-m', 'hifz-1-f']],
      ['নাজেরা গ্রুপ', ['najera-1-f']],
      ['কুরআন গ্রুপ', ['qaida-a']],
      ['আরবি গ্রুপ', ['l-1-a']],
      ['জেনারেল ক্লাস', ['nursery-a', 'two-m']],
    ]);
    // An inactive class still shows while it has lessons.
    const kept = assignment({ groupId: 'old', teacherId: 'x' });
    expect(groupSections(TYPES, groups, [kept]).at(-1)?.groups.map((g) => g.id)).toEqual(['old', 'nursery-a', 'two-m']);
  });

  it('fills a room row with its class and the groups seated there, and a group row with all its lessons', () => {
    const all = [qaida, qaidaLate, math];
    expect(cellLessons(all, 'nursery-a', { startsAt: 540, endsAt: 585 }, 'room').map((a) => a.id)).toEqual([math.id, qaida.id]);
    expect(cellLessons(all, 'nursery-a', { startsAt: 540, endsAt: 585 }, 'room', 2).map((a) => a.id)).toEqual([qaida.id]);
    expect(cellLessons(all, 'qaida-a', { startsAt: 660, endsAt: 705 }, 'group').map((a) => a.id)).toEqual([qaidaLate.id]);
    expect(cellLessons(all, 'two-m', { startsAt: 660, endsAt: 705 }, 'room').map((a) => a.id)).toEqual([qaidaLate.id]);
  });
});
