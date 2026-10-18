// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { PGlite } from '@electric-sql/pglite';
import { createPgliteDb, pgliteDrizzle } from '../admissions/testing/pg';
import { listGroups, listRooms, listRoutines, listSubjects, listTeachers, pickRoutine, routineData, saveSubject, saveTeacher } from './data';
import { setRoutineDbForTests, type RoutineDb } from './db';
import * as schema from './schema';
import { readSheet } from './sheet-import';
import { applyPlan, type TeacherSeed } from './sheet-import-apply';
import { SAMPLE_NAMES, SAMPLE_SHEET, sampleLookup } from './testing/sheet-sample';

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
beforeEach(async () => {
  await db.execute(sql`TRUNCATE routine_routines, routine_subjects, routine_rooms, routine_groups, routine_teachers CASCADE`);
});

const seed = (shortName: string): TeacherSeed => ({
  fullName: `${shortName} (full)`,
  shortName,
  gender: ['Ruhul', 'Hamid', 'Moin', 'Karim'].includes(shortName) ? 'male' : 'female',
  designation: '',
  department: '',
  qualification: '',
  experienceYears: null,
  phone: '',
  salary: null,
  targetPeriods: null,
  bio: '',
  erpId: null,
  isVacancy: shortName === 'Science-1',
  active: true,
});
const seeds = SAMPLE_NAMES.map(seed);

describe('applyPlan', () => {
  it('writes the sheet as a draft routine', async () => {
    const plan = readSheet(SAMPLE_SHEET, sampleLookup);
    const result = await applyPlan(plan, seeds, 'শিট থেকে');
    expect(result.refused).toEqual([]);
    expect(result.created).toEqual({ subjects: 7, rooms: 1, groups: 6, teachers: SAMPLE_NAMES.length, classes: plan.assignments.length });

    const routine = (await pickRoutine(result.routineId))!;
    expect(routine.status).toBe('draft');
    const data = await routineData(routine);
    expect(data.periods.map((p) => p.label)).toEqual(['হিফয', 'হিফয', 'কুরআন', 'আরবি', '', '', 'হিফয (বিকেল)']);
    expect(data.assignments).toHaveLength(plan.assignments.length);

    const groups = await listGroups();
    const rooms = await listRooms();
    expect(groups.find((g) => g.name === 'hifz (m)')).toMatchObject({ genderRule: 'male', section: 'হিফয' });
    expect(groups.find((g) => g.name === 'L-1 B')).toMatchObject({ band: 'LEVEL-1', kind: 'level' });
    expect(groups.find((g) => g.name === 'Nursery-A')).toMatchObject({ genderRule: 'any', defaultRoomId: rooms[0].id });
    expect(rooms).toEqual([expect.objectContaining({ name: '402', shared: true })]);

    // A teacher starts with the subjects the sheet gives them.
    const subjects = await listSubjects();
    const sadia = (await listTeachers()).find((t) => t.shortName === 'Sadia')!;
    expect(sadia.subjectIds.map((id) => subjects.find((s) => s.id === id)!.name).sort()).toEqual(['Bangla', 'Math']);
    expect(sadia.fullName).toBe('Sadia (full)');
  });

  it('reuses what exists, keeps a class whose TA clashes and refuses a clash', async () => {
    await saveSubject({ name: 'math', sort: 0, active: true });
    await saveTeacher({ ...seed('Tania'), fullName: 'Tania from before', subjectIds: [] });
    const plan = readSheet(SAMPLE_SHEET, sampleLookup);
    const base = plan.assignments[0];
    plan.assignments.push(
      // Moin teaches Qaida-A at 9:00, so as a TA there he clashes; the class stays without him.
      { ...base, cell: 'X1', group: 'Nursery-A', col: 3, days: [0], subject: 'Math', teacher: 'Rina', ta: 'Moin', note: '' },
      // Ruhul is in Hifz at 7:00 every day: refused.
      { ...base, cell: 'X2', group: 'Nursery-B', col: 1, days: [0], subject: 'Math', teacher: 'Ruhul', ta: null, note: '' },
    );
    const result = await applyPlan(plan, seeds, 'শিট থেকে');
    expect(result.created.subjects).toBe(6);
    expect(result.created.teachers).toBe(SAMPLE_NAMES.length - 1);
    expect((await listTeachers()).find((t) => t.shortName === 'Tania')!.fullName).toBe('Tania from before');
    expect(result.refused.map((r) => [r.cell, r.problem.startsWith('সহকারী Moin বাদ')])).toEqual([
      ['X1', true],
      ['X2', false],
    ]);
    expect(result.created.classes).toBe(plan.assignments.length - 1);
    const data = await routineData((await pickRoutine(result.routineId))!);
    const nurseryA = (await listGroups()).find((g) => g.name === 'Nursery-A')!;
    expect(data.assignments.find((a) => a.groupId === nurseryA.id && a.periodId === data.periods[2].id)).toMatchObject({ taId: null });
  });

  it('refuses a routine name that is taken', async () => {
    const plan = readSheet(SAMPLE_SHEET, sampleLookup);
    await applyPlan(plan, seeds, 'শিট থেকে');
    await expect(applyPlan(plan, seeds, 'শিট থেকে')).rejects.toThrow('already exists');
    expect(await listRoutines()).toHaveLength(1);
  });
});
