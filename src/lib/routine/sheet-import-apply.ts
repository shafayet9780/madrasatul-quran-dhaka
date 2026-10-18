import 'server-only';
import { createRoutine, listGroups, listRooms, listRoutines, listSubjects, listTeachers, routineData, saveAssignment, saveGroup, savePeriod, saveRoom, saveSubject, saveTeacher, type TeacherInput } from './data';
import type { Issue, Plan } from './sheet-import';
import type { GenderRule } from './types';

// Writes a plan read from the sheet (./sheet-import.ts) as a new DRAFT routine. Subjects, rooms,
// groups and teachers that already exist (same name) are reused and left as they are; every class
// goes through saveAssignment, so a clash is refused exactly as in the admin and lands in `refused`.

export type TeacherSeed = Omit<TeacherInput, 'id' | 'subjectIds'>;
export type ApplyResult = { routineId: string; created: Record<'subjects' | 'rooms' | 'groups' | 'teachers' | 'classes', number>; refused: Issue[] };

const key = (s: string) => s.trim().toLowerCase();
const genderRule = (name: string): GenderRule => (/\(m\)\s*$/i.test(name) ? 'male' : /\(f\)\s*$/i.test(name) ? 'female' : 'any');

export async function applyPlan(plan: Plan, teachers: TeacherSeed[], routineName: string): Promise<ApplyResult> {
  if ((await listRoutines()).some((r) => key(r.name) === key(routineName))) throw new Error(`A routine named "${routineName}" already exists.`);
  const created = { subjects: 0, rooms: 0, groups: 0, teachers: 0, classes: 0 };
  const must = async (outcome: Promise<{ ok: boolean; error?: string }>, what: string) => {
    const r = await outcome;
    if (!r.ok) throw new Error(`${what}: ${r.error}`);
  };

  const subjectNames = [...new Map(plan.assignments.map((a) => [key(a.subject), a.subject])).values()];
  let subjects = await listSubjects();
  for (const name of subjectNames.filter((n) => !subjects.some((s) => key(s.name) === key(n)))) {
    await must(saveSubject({ name, sort: subjects.length + created.subjects, active: true }), `Subject ${name}`);
    created.subjects++;
  }
  subjects = await listSubjects();
  const subjectId = (name: string) => subjects.find((s) => key(s.name) === key(name))!.id;

  let rooms = await listRooms();
  for (const room of plan.rooms.filter((r) => !rooms.some((x) => key(x.name) === key(r.name)))) {
    await must(saveRoom(room), `Room ${room.name}`);
    created.rooms++;
  }
  rooms = await listRooms();

  let groups = await listGroups();
  for (const g of plan.groups.filter((x) => !groups.some((y) => key(y.name) === key(x.name)))) {
    const defaultRoomId = g.room ? rooms.find((r) => key(r.name) === key(g.room))!.id : null;
    await must(saveGroup({ name: g.name, kind: g.kind, section: g.section, band: g.band, sort: g.sort, defaultRoomId, genderRule: genderRule(g.name), active: true }), `Group ${g.name}`);
    created.groups++;
  }
  groups = await listGroups();
  const groupId = (name: string) => groups.find((g) => key(g.name) === key(name))!.id;

  // A new teacher starts with the subjects the sheet has them teach.
  let staff = (await listTeachers()).filter((t) => t.active);
  for (const seed of teachers.filter((t) => !staff.some((s) => key(s.shortName) === key(t.shortName)))) {
    const own = plan.assignments.filter((a) => a.teacher === seed.shortName || a.ta === seed.shortName).map((a) => subjectId(a.subject));
    await must(saveTeacher({ ...seed, subjectIds: [...new Set(own)] }), `Teacher ${seed.shortName}`);
    created.teachers++;
  }
  staff = (await listTeachers()).filter((t) => t.active);
  const teacherId = (shortName: string) => staff.find((t) => key(t.shortName) === key(shortName))?.id;

  const routine = await createRoutine(routineName);
  if (!routine.ok || !routine.id) throw new Error(`Routine: ${'error' in routine ? routine.error : ''}`);
  for (const p of plan.periods) await must(savePeriod(routine.id, { label: p.label, startsAt: p.startsAt, endsAt: p.endsAt }), `Period ${p.startsAt}`);
  const { periods } = await routineData({ id: routine.id, name: routineName, status: 'draft', createdAt: '' });
  const periodId = (col: number) => periods.find((p) => p.startsAt === plan.periods.find((x) => x.col === col)!.startsAt)!.id;

  const refused: Issue[] = [];
  for (const a of plan.assignments) {
    const text = `${a.group}: ${a.subject}, ${a.teacher}${a.ta ? ` + ${a.ta}` : ''}`;
    const main = teacherId(a.teacher);
    const ta = a.ta ? (teacherId(a.ta) ?? null) : null;
    if (!main || (a.ta && !ta)) {
      refused.push({ cell: a.cell, text, problem: `শিক্ষক "${!main ? a.teacher : a.ta}" নামের তালিকায় নেই` });
      continue;
    }
    const draft = { groupId: groupId(a.group), periodId: periodId(a.col), days: a.days, subjectId: subjectId(a.subject), teacherId: main, taId: ta, roomId: null, note: a.note };
    let r = await saveAssignment(routine.id, draft, true);
    // Keep the class when only the TA clashes; the TA goes to the fix list.
    if (!r.ok && ta) {
      const without = await saveAssignment(routine.id, { ...draft, taId: null }, true);
      if (without.ok) refused.push({ cell: a.cell, text, problem: `সহকারী ${a.ta} বাদ দেওয়া হয়েছে: ${r.error}` });
      if (without.ok) r = without;
    }
    if (r.ok) created.classes++;
    else refused.push({ cell: a.cell, text, problem: r.error });
  }
  return { routineId: routine.id, created, refused };
}
