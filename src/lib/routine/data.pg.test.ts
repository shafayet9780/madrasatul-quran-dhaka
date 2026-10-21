// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { PGlite } from '@electric-sql/pglite';
import { createPgliteDb, pgliteDrizzle } from '../admissions/testing/pg';
import {
  activateRoutine,
  createRoutine,
  deleteAbsence,
  deleteAssignment,
  deleteGroup,
  deleteType,
  deleteTeacher,
  listRoutines,
  pickRoutine,
  proxyDay,
  routineData,
  saveAbsence,
  saveAssignment,
  saveGroup,
  saveRoom,
  saveSubject,
  saveTeacher,
  saveType,
  setProxy,
  setTeacherTarget,
  teacherFootprint,
  type TeacherInput,
} from './data';
import { setRoutineDbForTests, type RoutineDb } from './db';
import * as schema from './schema';

let client: PGlite;
let db: RoutineDb;

beforeAll(async () => {
  ({ client } = await createPgliteDb());
  db = pgliteDrizzle(client, schema) as unknown as RoutineDb;
  setRoutineDbForTests(db);
});
afterAll(async () => {
  setRoutineDbForTests(undefined);
  await client.close();
});

const ids: Record<string, string> = {};
const id = (key: string) => ids[key];
const ok = <T extends { ok: boolean }>(r: T) => {
  expect(r).toMatchObject({ ok: true });
  return r as T & { id: string };
};

const teacherInput = (shortName: string, extra: Partial<TeacherInput> = {}): TeacherInput => ({
  fullName: shortName,
  shortName,
  gender: 'female',
  designation: '',
  department: '',
  qualification: '',
  experienceYears: null,
  phone: '',
  salary: null,
  targetPeriods: 10,
  bio: '',
  erpId: null,
  isVacancy: false,
  active: true,
  subjectIds: [],
  ...extra,
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE routine_routines, routine_subjects, routine_rooms, routine_groups, routine_teachers, routine_absences, routine_proxies CASCADE`);
  // The five class types come from the migration.
  for (const t of await db.select().from(schema.routineClassTypes)) ids[t.placement === 'class' ? 'general' : t.name === 'হিফয' ? 'hifz' : t.name === 'কুরআন' ? 'quran' : t.name === 'আরবি' ? 'arabic' : 'najera'] = t.id;
  ok(await saveSubject({ typeId: id('general'), name: 'Math', sort: 0, active: true }));
  ok(await saveSubject({ typeId: id('quran'), name: 'Qaida', sort: 0, active: true }));
  ok(await saveSubject({ typeId: id('hifz'), name: 'Hifz', sort: 0, active: true }));
  for (const s of await db.select().from(schema.routineSubjects)) ids[s.name] = s.id;
  ok(await saveRoom({ name: '402' }));
  ids.r402 = (await db.select().from(schema.routineRooms))[0].id;
  const group = (name: string, typeId: string, extra: Partial<Parameters<typeof saveGroup>[0]> = {}) =>
    saveGroup({ name, typeId, sort: 0, defaultRoomId: null, genderRule: 'any', active: true, ...extra });
  ids.nursery = ok(await group('nursery', id('general'), { defaultRoomId: id('r402') })).id;
  ids.kg = ok(await group('kg', id('general'))).id;
  ids.qaidaA = ok(await group('qaida-a', id('quran'))).id;
  ids.hifz = ok(await group('hifz-1 (M)', id('hifz'), { genderRule: 'male' })).id;
  ids.mueen = ok(await saveTeacher(teacherInput('Mueen', { gender: 'male', subjectIds: [id('Qaida')] }))).id;
  ids.nasreen = ok(await saveTeacher(teacherInput('Nasreen', { subjectIds: [id('Qaida'), id('Math')] }))).id;
  ids.dolon = ok(await saveTeacher(teacherInput('Dolon', { subjectIds: [id('Math')] }))).id;
  ids.routine = ok(await createRoutine('২০২৭')).id;
});

/** Qaida-A in nursery's room at 9:00–9:45 every day, taught by Mueen, unless told otherwise. */
const assign = (extra: Partial<Parameters<typeof saveAssignment>[1]> = {}, confirm = false, routine = id('routine')) =>
  saveAssignment(routine, { groupId: id('qaidaA'), hostGroupId: id('nursery'), startsAt: 540, endsAt: 585, days: [0, 1, 2, 3, 4, 5], subjectId: id('Qaida'), teacherId: id('mueen'), taId: null, ...extra }, confirm);
const math = (extra: Partial<Parameters<typeof saveAssignment>[1]> = {}) => assign({ groupId: id('nursery'), hostGroupId: null, subjectId: id('Math'), teacherId: id('dolon'), ...extra });

describe('lessons', () => {
  it('refuses a teacher, group or room at overlapping times, and allows day-split rows and back to back', async () => {
    ok(await assign({ days: [1, 2, 3] }));
    // Mueen at 9:30 in kg on Tuesday runs into his 9:00–9:45.
    expect(await assign({ groupId: id('kg'), hostGroupId: null, subjectId: id('Math'), startsAt: 570, endsAt: 615, days: [3, 4] }, true)).toMatchObject({ ok: false, error: 'Mueen মঙ্গল ৯:০০–৯:৪৫-এ qaida-a-এ আছেন।' });
    expect(await assign({ teacherId: id('nasreen'), days: [2] })).toMatchObject({ ok: false, error: expect.stringContaining('qaida-a-এর সোম ৯:০০–৯:৪৫-এ আগে থেকেই Qaida আছে।') });
    // Nursery's own lesson can't be in its room while Qaida-A sits there.
    expect(await math({ startsAt: 570, endsAt: 615, days: [1] })).toMatchObject({ ok: false, error: 'nursery-এর রুমে রবি ৯:০০–৯:৪৫-এ qaida-a চলে।' });
    ok(await assign({ teacherId: id('nasreen'), days: [4, 5] }));
    ok(await math({ startsAt: 585, endsAt: 630 }));
  });

  it('wants the subject of the class type and a host room only for seated groups', async () => {
    expect(await assign({ subjectId: id('Math') })).toMatchObject({ ok: false, error: 'এই সাবজেক্ট এই ধরনের ক্লাসের না।' });
    expect(await assign({ hostGroupId: null })).toMatchObject({ ok: false, error: 'কোন ক্লাসের রুমে বসে, সেটা সিলেক্ট করুন।' });
    expect(await assign({ hostGroupId: id('hifz') })).toMatchObject({ ok: false });
    expect(await math({ hostGroupId: id('kg') })).toMatchObject({ ok: false, error: 'এই ক্লাস বা গ্রুপ নিজের রুমে বসে।' });
    expect(await assign({ startsAt: 600, endsAt: 540 })).toMatchObject({ ok: false });
  });

  it('asks before saving a subject the teacher is not listed for, or against the gender rule', async () => {
    expect(await assign({ teacherId: id('dolon') })).toMatchObject({ ok: false, warnings: ['Dolon-এর সাবজেক্টের লিস্টে Qaida নেই।'] });
    ok(await assign({ teacherId: id('dolon') }, true));
    const hifz = { groupId: id('hifz'), hostGroupId: null, subjectId: id('Hifz'), startsAt: 420, endsAt: 495 };
    expect(await assign({ ...hifz, teacherId: id('nasreen') })).toMatchObject({ ok: false, warnings: expect.arrayContaining(['hifz-1 (M)-এ শুধু পুরুষ টিচার পড়ান, কিন্তু Nasreen মহিলা।']) });
  });

  it('sets a weekly target on its own', async () => {
    ok(await setTeacherTarget(id('dolon'), 21));
    expect((await db.select().from(schema.routineTeachers)).find((t) => t.id === id('dolon'))).toMatchObject({ targetPeriods: 21, shortName: 'Dolon' });
    ok(await setTeacherTarget(id('dolon'), null));
    expect(await setTeacherTarget(crypto.randomUUID(), 5)).toMatchObject({ ok: false });
  });

  it('leaves the gender empty only for an open post', async () => {
    expect(await saveTeacher(teacherInput('Nobody', { gender: null }))).toMatchObject({ ok: false });
    ok(await saveTeacher(teacherInput('Science-9', { gender: null, isVacancy: true })));
    await expect(db.insert(schema.routineTeachers).values({ fullName: 'X', shortName: 'X', gender: null })).rejects.toThrow();
  });

  it('keeps the database guard: an overlapping booking fails, a touching one does not', async () => {
    const { id: a } = ok(await assign({ days: [0] }));
    const slot = { routineId: id('routine'), day: 0, kind: 'teacher' as const, refId: id('mueen'), assignmentId: a };
    await expect(db.insert(schema.routineSlots).values({ ...slot, startsAt: 570, endsAt: 600 })).rejects.toThrow();
    await db.insert(schema.routineSlots).values({ ...slot, startsAt: 585, endsAt: 600 });
  });
});

describe('setup', () => {
  it('keeps a type while it has groups or subjects, and its placement while it has lessons', async () => {
    expect(await deleteType(id('quran'))).toMatchObject({ ok: false });
    ok(await assign());
    expect(await saveType({ id: id('quran'), name: 'কুরআন', placement: 'own_room' })).toMatchObject({ ok: false });
    ok(await saveType({ id: id('quran'), name: 'কুরআন শিক্ষা', placement: 'seated' }));
    ok(await saveType({ id: id('quran'), name: 'কুরআন', placement: 'seated' }));
    ok(await saveType({ name: 'নতুন', placement: 'class' }));
    const added = (await db.select().from(schema.routineClassTypes)).find((t) => t.name === 'নতুন')!;
    expect(added.sort).toBe(5);
    ok(await deleteType(added.id));
  });

  it('keeps a group with lessons in its type (its subjects are that type\'s)', async () => {
    ok(await assign());
    const qaidaA = { name: 'qaida-a', sort: 0, defaultRoomId: null, genderRule: 'any' as const, active: true };
    expect(await saveGroup({ id: id('qaidaA'), typeId: id('arabic'), ...qaidaA })).toMatchObject({ ok: false });
    // A class that only hosts a seated group can't become a group itself.
    expect(await saveType({ id: id('general'), name: 'জেনারেল', placement: 'own_room' })).toMatchObject({ ok: false });
  });

  it('keeps a class while a lesson uses it or its room', async () => {
    ok(await assign());
    expect(await deleteGroup(id('nursery'))).toMatchObject({ ok: false });
    expect(await deleteGroup(id('qaidaA'))).toMatchObject({ ok: false });
    ok(await deleteGroup(id('kg')));
    // A seated group has no room of its own.
    const r = await saveGroup({ name: 'qaida-b', typeId: id('quran'), sort: 0, defaultRoomId: id('r402'), genderRule: 'any', active: true });
    expect((await db.select().from(schema.routineGroups)).find((g) => g.id === ok(r).id)?.defaultRoomId).toBeNull();
  });

  it('allows the same subject name under two types', async () => {
    ok(await saveSubject({ typeId: id('arabic'), name: 'Math', sort: 0, active: true }));
    expect(await saveSubject({ typeId: id('general'), name: 'math', sort: 0, active: true })).toMatchObject({ ok: false });
  });
});

describe('deleting a teacher', () => {
  it('takes their lessons with them, drops them as TA, and hides a teacher with history instead', async () => {
    ok(await assign());
    ok(await math({ startsAt: 600, endsAt: 645, taId: id('mueen') }));
    expect(await teacherFootprint(id('mueen'))).toEqual({ lessons: 1, taLessons: 1, history: false });
    ok(await deleteTeacher(id('mueen')));
    const data = await routineData((await pickRoutine())!);
    expect(data.assignments.map((a) => [a.teacherId, a.taId])).toEqual([[id('dolon'), null]]);
    expect(data.teachers.some((t) => t.id === id('mueen'))).toBe(false);
    // Mueen's 9:00 slot is free again; so is his TA slot at 10:00.
    ok(await assign({ teacherId: id('nasreen') }));

    ok(await saveAbsence('2025-01-05', id('dolon'), null, ''));
    ok(await deleteTeacher(id('dolon')));
    const after = await routineData((await pickRoutine())!);
    expect(after.teachers.find((t) => t.id === id('dolon'))).toMatchObject({ active: false });
    expect(after.assignments.map((a) => a.teacherId)).toEqual([id('nasreen')]);
  });
});

describe('routines', () => {
  it('copies lessons; the copy is edited on its own', async () => {
    ok(await assign());
    const copy = ok(await createRoutine('২০২৮', id('routine'))).id;
    const data = await routineData((await pickRoutine(copy))!);
    expect(data.assignments).toHaveLength(1);
    // Same teacher, same time, other routine: no clash; inside the copy: clash.
    expect(await assign({ groupId: id('kg'), hostGroupId: null, subjectId: id('Math') }, true, copy)).toMatchObject({ ok: false });
    ok(await assign({ groupId: id('kg'), hostGroupId: null, subjectId: id('Math'), startsAt: 600, endsAt: 645 }, true, copy));
  });

  it('keeps one active routine', async () => {
    const other = ok(await createRoutine('খসড়া')).id;
    ok(await activateRoutine(id('routine')));
    ok(await activateRoutine(other));
    const all = await listRoutines();
    expect(all.find((r) => r.id === id('routine'))).toMatchObject({ assignments: 0, status: 'draft' });
    expect(all.filter((r) => r.status === 'active').map((r) => r.id)).toEqual([other]);
    expect((await pickRoutine())?.id).toBe(other);
  });
});

describe('proxies', () => {
  const sunday = '2026-10-18';

  it('records a proxy, refuses a busy teacher, and drops it when the absence goes', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign({ hostGroupId: id('kg') }));
    ok(await math({ startsAt: 570, endsAt: 615 }));
    ok(await saveAbsence(sunday, id('mueen'), null, 'অসুস্থ'));
    expect(await setProxy(sunday, qaida, 'main', id('dolon'))).toMatchObject({ ok: false });
    ok(await setProxy(sunday, qaida, 'main', id('nasreen')));
    let day = await proxyDay(sunday);
    expect(day.proxies.map((p) => [p.proxyTeacherId, p.snapshot.absent, p.snapshot.period, p.startsAt])).toEqual([[id('nasreen'), 'Mueen', '৯:০০–৯:৪৫', 540]]);
    expect(day.monthCounts).toEqual({ [id('nasreen')]: 1 });
    ok(await deleteAbsence(day.absences[0].id));
    day = await proxyDay(sunday);
    expect(day.proxies).toEqual([]);
  });

  // From today on, proxies are checked again whenever the routine or the absences change.
  const later = '2030-01-06'; // a Sunday
  const past = '2025-01-05'; // a Sunday

  it('drops a proxy whose teacher is now away or now has a lesson then', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    ok(await saveAbsence(later, id('mueen'), null, ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await saveAbsence(later, id('nasreen'), [{ startsAt: 570, endsAt: 600 }], ''));
    expect((await proxyDay(later)).proxies).toEqual([]);

    ok(await saveAbsence(later, id('nasreen'), [{ startsAt: 645, endsAt: 690 }], ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await assign({ groupId: id('kg'), hostGroupId: null, subjectId: id('Math'), teacherId: id('nasreen'), startsAt: 560, endsAt: 600, days: [1] }));
    expect((await proxyDay(later)).proxies).toEqual([]);
  });

  it('drops upcoming proxies of a deleted lesson or an old routine, and keeps past ones', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    for (const date of [past, later]) {
      ok(await saveAbsence(date, id('mueen'), null, ''));
      ok(await setProxy(date, qaida, 'main', id('nasreen')));
    }
    const copy = ok(await createRoutine('২০২৮', id('routine'))).id;
    ok(await activateRoutine(copy));
    expect((await proxyDay(later)).proxies).toEqual([]);
    expect((await db.select().from(schema.routineProxies)).map((p) => p.date)).toEqual([past]);

    ok(await activateRoutine(id('routine')));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await deleteAssignment(qaida));
    expect((await db.select().from(schema.routineProxies)).map((p) => [p.date, p.assignmentId, p.snapshot.absent])).toEqual([[past, null, 'Mueen']]);
  });

  it('drops an upcoming proxy when its lesson moves, or its teacher is taken off the list', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    ok(await saveAbsence(later, id('mueen'), null, ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await assign({ id: qaida, startsAt: 600, endsAt: 645 }));
    expect((await proxyDay(later)).proxies).toEqual([]);

    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    const nasreen = (await routineData((await pickRoutine())!)).teachers.find((t) => t.id === id('nasreen'))!;
    ok(await saveTeacher({ ...nasreen, active: false }));
    expect((await proxyDay(later)).proxies).toEqual([]);
  });

  it('keeps a proxy teacher to one cover at a time in the database', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    ok(await saveAbsence(later, id('mueen'), null, ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    await expect(
      db.insert(schema.routineProxies).values({ date: later, assignmentId: null, role: 'main', startsAt: 570, endsAt: 600, proxyTeacherId: id('nasreen'), snapshot: { group: '', subject: '', period: '', absent: '' } }),
    ).rejects.toThrow();
  });

  it('has no classes on Friday', async () => {
    expect(await saveAbsence('2026-10-23', id('mueen'), null, '')).toMatchObject({ ok: false });
  });
});

describe('local preview sample', () => {
  it('loads without a clash', async () => {
    const { loadRoutineFixtures } = await import('./testing/dev-fixtures');
    expect(await loadRoutineFixtures()).toMatch(/sample routine loaded/);
    const routine = await pickRoutine();
    expect(routine?.status).toBe('active');
    expect((await routineData(routine!)).assignments.length).toBeGreaterThan(40);
  });
});
