import { describe, expect, it } from 'vitest';
import { editorChoices, freeOnDate, proxyChoices } from './availability';
import { dhakaMinutes, periodAt } from './days';
import { assignment, group, period, teacher } from './testing/sample';

const periods = [period('p1', 540, 585), period('p2', 600, 645), period('eve', 900, 1200)];
const groups = new Map([group('qaida-a'), group('two-f'), group('one-a'), group('hifz-m', { genderRule: 'male' })].map((g) => [g.id, g]));
const teachers = [
  teacher('mueen', { gender: 'male', subjectIds: ['quran'] }),
  teacher('nasreen', { subjectIds: ['quran', 'islam'] }),
  teacher('dolon', { subjectIds: ['islam'] }),
  teacher('kamal', { gender: 'male', subjectIds: ['english'] }),
  teacher('lubna', { subjectIds: ['quran'] }),
  teacher('science-1', { isVacancy: true, gender: null, subjectIds: ['quran'] }),
];
const qaidaA = assignment({ groupId: 'qaida-a', periodId: 'p1', teacherId: 'mueen', subjectId: 'quran', days: [1, 2, 3] });
const english = assignment({ groupId: 'one-a', periodId: 'p1', teacherId: 'kamal', subjectId: 'english' });
const islam = assignment({ groupId: 'two-f', periodId: 'p2', teacherId: 'nasreen', subjectId: 'islam' });
const all = [qaidaA, english, islam];

describe('proxy choices', () => {
  const need = { assignment: qaidaA, role: 'main' as const, absentId: 'mueen' };
  const ctx = { teachers, assignments: all, periods, day: 1, absences: [{ teacherId: 'mueen', periodIds: null }], proxies: [], monthCounts: new Map<string, number>(), groups };

  it('lists free teachers green, subject teachers first, and the rest red with why', () => {
    const choices = proxyChoices(need, { ...ctx, absences: [...ctx.absences, { teacherId: 'lubna', periodIds: ['p1'] }] });
    expect(choices.map((c) => [c.teacher.id, c.free, c.canTeach, c.why])).toEqual([
      ['nasreen', true, true, ''],
      ['dolon', true, false, ''],
      ['kamal', false, false, 'one-a-এ ক্লাস'],
      ['lubna', false, true, 'অ্যাবসেন্ট'],
    ]);
    // The absent teacher and open posts aren't choices.
    expect(choices.some((c) => c.teacher.id === 'mueen' || c.teacher.id === 'science-1')).toBe(false);
    expect(choices[0].meta).toBe('আজ ১টা ক্লাস');
    expect(choices[1].meta).toBe('আজ ০টা ক্লাস · এ সময় স্কুলে থাকেন না');
    expect(proxyChoices(need, { ...ctx, today: false })[0].meta).toMatch(/^এ দিন /);
  });

  it('names another proxy in the same period', () => {
    const other = [{ id: 'x', assignmentId: islam.id, role: 'main' as const, periodId: 'p1', proxyTeacherId: 'dolon' }];
    expect(proxyChoices(need, { ...ctx, proxies: other }).find((c) => c.teacher.id === 'dolon')).toMatchObject({ free: false, why: 'two-f-এ প্রক্সি' });
  });
});

describe('editor choices', () => {
  it('turns a teacher red only on a clash on the chosen days, naming the days when partial', () => {
    const choices = editorChoices({ teachers, assignments: all, groups, groupId: 'qaida-a', periodId: 'p1', days: [0, 1, 2, 3, 4, 5], subjectId: 'quran' });
    const by = Object.fromEntries(choices.map((c) => [c.teacher.id, c]));
    expect(by.mueen).toMatchObject({ free: false, why: 'qaida-a-এ ক্লাস (রবি–মঙ্গল)' });
    expect(by.kamal).toMatchObject({ free: false, why: 'one-a-এ ক্লাস' });
    expect(by['science-1']).toMatchObject({ free: true, meta: 'খালি পোস্ট · সপ্তাহে ০টা ক্লাস' });
    // A group's gender rule stays a note on a free teacher; the server asks on save.
    const hifz = editorChoices({ teachers, assignments: all, groups, groupId: 'hifz-m', periodId: 'p2', days: [0], subjectId: 'quran' });
    expect(hifz.find((c) => c.teacher.id === 'lubna')).toMatchObject({ free: true, meta: 'এই গ্রুপে শুধু পুরুষ টিচার · সপ্তাহে ০টা ক্লাস' });
    expect(hifz.find((c) => c.teacher.id === 'mueen')?.meta).toBe('সপ্তাহে ৩টা ক্লাস');
    // Mueen is free on the days he has no class.
    expect(editorChoices({ teachers, assignments: all, groups, groupId: 'qaida-a', periodId: 'p1', days: [4, 5], subjectId: 'quran' }).find((c) => c.teacher.id === 'mueen')?.free).toBe(true);
    // Editing a row doesn't clash with itself.
    expect(editorChoices({ teachers, assignments: all, groups, groupId: 'qaida-a', periodId: 'p1', days: [1], subjectId: 'quran', exceptId: qaidaA.id }).find((c) => c.teacher.id === 'mueen')?.free).toBe(true);
  });

  it('puts the free ones first, lightest week first', () => {
    const ids = editorChoices({ teachers, assignments: all, groups, groupId: 'qaida-a', periodId: 'p2', days: [0], subjectId: 'islam' }).map((c) => [c.teacher.id, c.free]);
    expect(ids[ids.length - 1]).toEqual(['nasreen', false]);
    expect(ids.slice(0, 3).map(([id]) => id)).toEqual(['dolon', 'lubna', 'science-1']);
  });
});

describe('free on a date', () => {
  it('leaves out the absent and those on a proxy, and splits who is at school', () => {
    const proxies = [{ id: 'x', assignmentId: qaidaA.id, role: 'main' as const, periodId: 'p1', proxyTeacherId: 'dolon' }];
    const ctx = { teachers, assignments: all, periods, day: 1, absences: [{ teacherId: 'mueen', periodIds: null }], proxies };
    const p1 = freeOnDate({ ...ctx, periodId: 'p1' });
    expect([p1.here.map((t) => t.id), p1.away.map((t) => t.id)]).toEqual([['nasreen'], ['lubna']]);
    // At 10:00 Dolon is at school (she has the 9:00 proxy); in the evening nobody is.
    expect(freeOnDate({ ...ctx, periodId: 'p2' }).here.map((t) => t.id)).toEqual(['dolon', 'kamal']);
    expect(freeOnDate({ ...ctx, periodId: 'eve' }).here).toEqual([]);
  });
});

describe('now', () => {
  it('reads Dhaka time and finds the running period', () => {
    expect(dhakaMinutes(new Date('2026-10-19T03:30:00Z'))).toBe(9 * 60 + 30);
    expect(periodAt(periods, 560)?.id).toBe('p1');
    expect(periodAt(periods, 590)).toBeNull();
  });
});
