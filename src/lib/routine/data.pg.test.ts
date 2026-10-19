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
  deleteRoom,
  deleteTeacher,
  listRoutines,
  pickRoutine,
  proxyDay,
  routineData,
  saveAbsence,
  saveAssignment,
  saveGroup,
  savePeriod,
  saveRoom,
  saveSubject,
  saveTeacher,
  setProxy,
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
  for (const name of ['Math', 'Quran']) {
    ok(await saveSubject({ name, sort: 0, active: true }));
  }
  const subjects = await db.select().from(schema.routineSubjects);
  for (const s of subjects) ids[s.name] = s.id;
  ids.r402 = ok(await saveRoom({ name: '402', shared: false })).id;
  ids.hall = ok(await saveRoom({ name: 'Hall', shared: true })).id;
  for (const [key, room] of [['nursery', 'r402'], ['kg', 'r402'], ['fiveM', 'hall'], ['fiveF', 'hall']]) {
    ids[key] = ok(await saveGroup({ name: key, kind: 'section', section: 'জেনারেল', band: '', sort: 0, defaultRoomId: id(room), genderRule: 'any', active: true })).id;
  }
  ids.mueen = ok(await saveTeacher(teacherInput('Mueen', { gender: 'male', subjectIds: [id('Quran')] }))).id;
  ids.nasreen = ok(await saveTeacher(teacherInput('Nasreen', { subjectIds: [id('Quran'), id('Math')] }))).id;
  ids.dolon = ok(await saveTeacher(teacherInput('Dolon', { subjectIds: [id('Math')] }))).id;
  ids.routine = ok(await createRoutine('২০২৭')).id;
  ok(await savePeriod(id('routine'), { label: 'কুরআন', startsAt: 540, endsAt: 585 }));
  ok(await savePeriod(id('routine'), { label: '', startsAt: 645, endsAt: 690 }));
  const periods = await db.select().from(schema.routinePeriods).orderBy(schema.routinePeriods.startsAt);
  ids.p1 = periods[0].id;
  ids.p2 = periods[1].id;
});

const assign = (extra: Partial<Parameters<typeof saveAssignment>[1]> = {}, confirm = false, routine = id('routine')) =>
  saveAssignment(routine, { groupId: id('nursery'), periodId: id('p1'), days: [0, 1, 2, 3, 4, 5], subjectId: id('Quran'), teacherId: id('mueen'), taId: null, roomId: null, note: '', ...extra }, confirm);

describe('assignments', () => {
  it('refuses a teacher, group or room in two places, and allows day-split rows', async () => {
    ok(await assign({ days: [1, 2, 3] }));
    expect(await assign({ groupId: id('fiveM'), days: [3, 4] })).toMatchObject({ ok: false, error: 'Mueen মঙ্গল এই পিরিয়ডে nursery-তে আছেন।' });
    expect(await assign({ teacherId: id('nasreen'), days: [2] })).toMatchObject({ ok: false, error: expect.stringContaining('nursery-এর এই পিরিয়ডে সোম আগে থেকেই ক্লাস আছে।') });
    expect(await assign({ groupId: id('kg'), teacherId: id('nasreen'), days: [1] })).toMatchObject({ ok: false, error: 'রুম 402 রবি এই পিরিয়ডে nursery ব্যবহার করছে।' });
    ok(await assign({ teacherId: id('nasreen'), days: [4, 5] }));
    // The hall is shared.
    ok(await assign({ groupId: id('fiveM'), teacherId: id('nasreen'), subjectId: id('Math'), periodId: id('p2') }));
    ok(await assign({ groupId: id('fiveF'), teacherId: id('dolon'), subjectId: id('Math'), periodId: id('p2') }));
  });

  it('asks before saving a subject the teacher is not listed for', async () => {
    const first = await assign({ teacherId: id('dolon') });
    expect(first).toMatchObject({ ok: false, warnings: ['Dolon-এর বিষয়ের তালিকায় Quran নেই।'] });
    ok(await assign({ teacherId: id('dolon') }, true));
  });

  it('leaves the gender empty only for an open post', async () => {
    expect(await saveTeacher(teacherInput('Nobody', { gender: null }))).toMatchObject({ ok: false });
    ok(await saveTeacher(teacherInput('Science-9', { gender: null, isVacancy: true })));
    await expect(db.insert(schema.routineTeachers).values({ fullName: 'X', shortName: 'X', gender: null })).rejects.toThrow();
  });

  it('keeps the database guard: a second booking of a slot fails', async () => {
    const { id: a } = ok(await assign({ days: [0] }));
    await expect(db.insert(schema.routineSlots).values({ routineId: id('routine'), periodId: id('p1'), day: 0, kind: 'teacher', refId: id('mueen'), assignmentId: a })).rejects.toThrow();
  });

  it('refuses to unshare a room or delete one when that would clash', async () => {
    ok(await assign({ groupId: id('fiveM'), teacherId: id('nasreen'), subjectId: id('Math') }));
    ok(await assign({ groupId: id('fiveF'), teacherId: id('dolon'), subjectId: id('Math') }));
    expect(await saveRoom({ id: id('hall'), name: 'Hall', shared: false })).toMatchObject({ ok: false, error: expect.stringContaining('রুম Hall-এ') });
    // nursery uses its own room 501 here; deleting 501 would put it back in 402, where kg is.
    const r501 = ok(await saveRoom({ name: '501', shared: false })).id;
    ok(await assign({ roomId: r501, periodId: id('p2') }));
    ok(await assign({ groupId: id('kg'), teacherId: id('dolon'), subjectId: id('Math'), periodId: id('p2') }));
    expect(await deleteRoom(r501)).toMatchObject({ ok: false });
    // Taking kg out of 402 makes the delete possible.
    ok(await saveGroup({ name: 'kg', kind: 'section', section: 'জেনারেল', band: '', sort: 0, defaultRoomId: null, genderRule: 'any', active: true, id: id('kg') }));
    ok(await deleteRoom(r501));
    const slots = await db.select().from(schema.routineSlots).where(sql`kind = 'room'`);
    expect(slots).toHaveLength(6);
  });

  it('refuses overlapping periods', async () => {
    expect(await savePeriod(id('routine'), { label: '', startsAt: 560, endsAt: 600 })).toMatchObject({ ok: false });
  });
});

describe('routines', () => {
  it('copies periods and assignments; the copy is edited on its own', async () => {
    ok(await assign());
    const copy = ok(await createRoutine('২০২৮', id('routine'))).id;
    const data = await routineData((await pickRoutine(copy))!);
    expect(data.periods).toHaveLength(2);
    expect(data.assignments).toHaveLength(1);
    // Same teacher, same time, other routine: no clash; inside the copy: clash.
    expect(await assign({ groupId: id('fiveM'), periodId: data.periods[0].id }, false, copy)).toMatchObject({ ok: false });
    ok(await assign({ groupId: id('fiveM'), periodId: data.periods[1].id }, false, copy));
  });

  it('keeps one active routine', async () => {
    const other = ok(await createRoutine('খসড়া')).id;
    ok(await activateRoutine(id('routine')));
    ok(await activateRoutine(other));
    const all = await listRoutines();
    expect(all.find((r) => r.id === id('routine'))).toMatchObject({ periods: 2, assignments: 0 });
    expect(all.filter((r) => r.status === 'active').map((r) => r.id)).toEqual([other]);
    expect((await pickRoutine())?.id).toBe(other);
  });
});

describe('proxies', () => {
  const sunday = '2026-10-18';

  it('records a proxy, refuses a busy teacher, and drops it when the absence goes', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    ok(await assign({ groupId: id('fiveM'), teacherId: id('dolon'), subjectId: id('Math') }));
    ok(await saveAbsence(sunday, id('mueen'), null, 'অসুস্থ'));
    expect(await setProxy(sunday, qaida, 'main', id('dolon'))).toMatchObject({ ok: false });
    ok(await setProxy(sunday, qaida, 'main', id('nasreen')));
    let day = await proxyDay(sunday);
    expect(day.proxies.map((p) => [p.proxyTeacherId, p.snapshot.absent])).toEqual([[id('nasreen'), 'Mueen']]);
    expect(day.monthCounts).toEqual({ [id('nasreen')]: 1 });
    // A teacher on the proxy register can't be deleted.
    expect(await deleteTeacher(id('nasreen'))).toMatchObject({ ok: false });
    ok(await deleteAbsence(day.absences[0].id));
    day = await proxyDay(sunday);
    expect(day.proxies).toEqual([]);
  });

  // From today on, proxies are checked again whenever the routine or the absences change.
  const later = '2030-01-06'; // a Sunday
  const past = '2025-01-05'; // a Sunday

  it('drops a proxy whose teacher is now away or now has a class then', async () => {
    ok(await activateRoutine(id('routine')));
    const { id: qaida } = ok(await assign());
    ok(await saveAbsence(later, id('mueen'), null, ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await saveAbsence(later, id('nasreen'), [id('p1')], ''));
    expect((await proxyDay(later)).proxies).toEqual([]);

    ok(await saveAbsence(later, id('nasreen'), [id('p2')], ''));
    ok(await setProxy(later, qaida, 'main', id('nasreen')));
    ok(await assign({ groupId: id('fiveM'), teacherId: id('nasreen'), subjectId: id('Math'), days: [1] }));
    expect((await proxyDay(later)).proxies).toEqual([]);
  });

  it('drops upcoming proxies of a deleted class or an old routine, and keeps past ones', async () => {
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
    expect((await routineData(routine!)).assignments).toHaveLength(29);
  });
});
