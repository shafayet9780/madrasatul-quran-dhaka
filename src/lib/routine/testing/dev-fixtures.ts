import 'server-only';
import { sql } from 'drizzle-orm';
import { activateRoutine, createRoutine, listGroups, listSubjects, listTeachers, listTypes, saveAbsence, saveAssignment, saveGroup, saveRoom, saveSubject, saveTeacher, type TeacherInput } from '../data';
import { dayOfDate, dhakaToday } from '../days';
import { getRoutineDb } from '../db';

/**
 * A sample routine for the local preview (ADMISSIONS_LOCAL=1), shaped like the school's sheet:
 * Hifz and Najera groups in their own rooms, classes, Quran and Arabic groups seated in the classes'
 * rooms (one moved to 11:00), a class on its own times (Six (F)), day-split cells, TAs, a vacancy and
 * one teacher away today. Names are made up. Replaces every routine row it finds (the class types
 * the migration seeded stay).
 */

// type name (as seeded) → subjects
const SUBJECTS: Record<string, string[]> = {
  জেনারেল: ['Bangla', 'English', 'Math', 'Science', 'Islam'],
  হিফয: ['Hifz'],
  নাজেরা: ['Najera'],
  কুরআন: ['Qaida', 'Ammapara'],
  আরবি: ['RA-1', 'RA-2', 'BA-1', 'Islam'],
};

// name, type, room (classes and own-room groups), gender rule
const GROUPS: [string, string, string | null, 'any' | 'male' | 'female'][] = [
  ['Hifz-1 (M)', 'হিফয', '301', 'male'],
  ['Hifz-2 (M)', 'হিফয', '302', 'male'],
  ['Hifz-1 (F)', 'হিফয', '601', 'female'],
  ['Hifz-2 (F)', 'হিফয', '602', 'female'],
  ['Najera-1 (M)', 'নাজেরা', '303', 'male'],
  ['Najera-2 (M)', 'নাজেরা', '304', 'male'],
  ['Najera-1 (F)', 'নাজেরা', '603', 'female'],
  ['Najera-2 (F)', 'নাজেরা', '604', 'female'],
  ['Nursery-A', 'জেনারেল', '402', 'any'],
  ['Nursery-B', 'জেনারেল', '404', 'any'],
  ['KG-A', 'জেনারেল', '201', 'any'],
  ['KG-B', 'জেনারেল', '202', 'any'],
  ['One-A', 'জেনারেল', '501', 'any'],
  ['Two (M)', 'জেনারেল', '204', 'any'],
  ['Two (F)', 'জেনারেল', '502', 'any'],
  ['Three (M)', 'জেনারেল', '203', 'any'],
  ['Six (F)', 'জেনারেল', '503', 'any'],
  ['Qaida-A', 'কুরআন', null, 'any'],
  ['Qaida-B', 'কুরআন', null, 'any'],
  ['Qaida-C', 'কুরআন', null, 'any'],
  ['Qaida-D', 'কুরআন', null, 'any'],
  ['Ammapara-1', 'কুরআন', null, 'any'],
  ['Ammapara-2', 'কুরআন', null, 'any'],
  ['Ammapara-3', 'কুরআন', null, 'any'],
  ['L-1 A', 'আরবি', null, 'any'],
  ['L-1 B', 'আরবি', null, 'any'],
  ['L-2 A', 'আরবি', null, 'any'],
  ['L-2 B', 'আরবি', null, 'any'],
  ['L-3', 'আরবি', null, 'any'],
];

// short name, full name, gender, subjects (by name, in every type that has them), target, salary, vacancy
const TEACHERS: [string, string, 'male' | 'female', string[], number | null, number | null, boolean?][] = [
  ['Amina', 'আমিনা খাতুন', 'female', ['English', 'Math'], 18, 20000],
  ['Bilal', 'হাফেজ বিলাল হোসেন', 'male', ['Ammapara', 'RA-2', 'Islam'], 24, 25000],
  ['Farzana', 'ফারজানা ইসলাম', 'female', ['Bangla', 'Islam', 'Ammapara'], 24, 18000],
  ['Hasan', 'মাওলানা হাসান আলী', 'male', ['Qaida', 'RA-1', 'Islam'], 22, 22000],
  ['Jamila', 'জামিলা আক্তার', 'female', ['Math', 'Science'], 24, 20000],
  ['Kamal', 'কামাল উদ্দিন', 'male', ['English', 'Bangla', 'RA-2'], 28, 20000],
  ['Lubna', 'লুবনা রহমান', 'female', ['Qaida', 'Islam'], 18, 15000],
  ['Maryam', 'মারইয়াম সুলতানা', 'female', ['Qaida', 'RA-1', 'Bangla'], 30, 18000],
  ['Nadia', 'নাদিয়া হক', 'female', ['English', 'Math', 'BA-1'], 24, 15000],
  ['Omar', 'হাফেজ ওমর ফারুক', 'male', ['Hifz'], 18, 30000],
  ['Rafiq', 'হাফেজ রফিকুল ইসলাম', 'male', ['Hifz', 'Najera'], 12, 22000],
  ['Tariq', 'হাফেজ তারিক হাসান', 'male', ['Hifz'], 18, 24000],
  ['Yusuf', 'ইউসুফ আলী', 'male', ['Najera'], 18, 18000],
  ['Zaid', 'যায়েদ হোসেন', 'male', ['Najera'], 18, 18000],
  ['Sadia', 'হাফেজা সাদিয়া', 'female', ['Hifz'], 18, 20000],
  ['Hafsa', 'হাফেজা হাফসা', 'female', ['Hifz', 'Najera'], 12, 18000],
  ['Ruqayya', 'হাফেজা রুকাইয়া', 'female', ['Hifz'], 18, 20000],
  ['Sumaiya', 'সুমাইয়া আক্তার', 'female', ['Najera'], 18, 16000],
  ['Zainab', 'যয়নব বেগম', 'female', ['Najera'], 18, 16000],
  ['Science-1', 'বিজ্ঞান শিক্ষক (নিয়োগ বাকি)', 'male', ['Science', 'Math'], 18, null, true],
];

const ALL = [0, 1, 2, 3, 4, 5];
const SAT_WED = [0, 1, 2, 3, 4];
// group, host class (seated groups), start, end, days, subject, teacher, TA
type Row = [string, string | null, number, number, number[], string, string, string?];
const HIFZ: [string, string, string, string?][] = [
  ['Hifz-1 (M)', 'Hifz', 'Omar', 'Rafiq'],
  ['Hifz-2 (M)', 'Hifz', 'Tariq'],
  ['Najera-1 (M)', 'Najera', 'Zaid'],
  ['Najera-2 (M)', 'Najera', 'Yusuf'],
  ['Hifz-1 (F)', 'Hifz', 'Sadia', 'Hafsa'],
  ['Hifz-2 (F)', 'Hifz', 'Ruqayya'],
  ['Najera-1 (F)', 'Najera', 'Sumaiya'],
  ['Najera-2 (F)', 'Najera', 'Zainab'],
];
const LESSONS: Row[] = [
  // Morning Hifz with a breakfast break, and the afternoon.
  ...HIFZ.flatMap(([g, s, t, ta]): Row[] => [
    [g, null, 420, 495, ALL, s, t, ta],
    [g, null, 510, 570, ALL, s, t, ta],
    [g, null, 900, 1200, SAT_WED, s, t, ta],
  ]),
  ['Qaida-A', 'Nursery-A', 540, 585, ALL, 'Qaida', 'Lubna'],
  ['Qaida-B', 'Nursery-B', 540, 585, ALL, 'Qaida', 'Hasan'],
  ['Qaida-C', 'KG-A', 540, 585, ALL, 'Qaida', 'Maryam'],
  ['Ammapara-1', 'KG-B', 540, 585, ALL, 'Ammapara', 'Bilal'],
  ['Ammapara-2', 'One-A', 540, 585, ALL, 'Ammapara', 'Farzana'],
  // A Quran group moved into a general time.
  ['Qaida-D', 'Three (M)', 660, 705, ALL, 'Qaida', 'Lubna'],
  ['L-1 A', 'Nursery-A', 600, 645, [0, 1, 2, 3], 'RA-1', 'Hasan'],
  ['L-1 A', 'Nursery-A', 600, 645, [4, 5], 'Islam', 'Lubna'],
  ['L-1 B', 'Nursery-B', 600, 645, ALL, 'RA-1', 'Maryam'],
  ['L-2 A', 'KG-A', 600, 645, ALL, 'RA-2', 'Bilal'],
  ['L-2 B', 'KG-B', 600, 645, ALL, 'RA-2', 'Kamal'],
  ['L-3', 'One-A', 600, 645, ALL, 'BA-1', 'Nadia'],
  ['Nursery-A', null, 645, 690, ALL, 'Math', 'Jamila'],
  ['Nursery-A', null, 690, 735, ALL, 'English', 'Amina'],
  ['Nursery-A', null, 735, 780, ALL, 'Bangla', 'Farzana'],
  ['Nursery-B', null, 645, 690, ALL, 'Bangla', 'Kamal'],
  ['Nursery-B', null, 690, 735, ALL, 'Math', 'Jamila'],
  ['Nursery-B', null, 735, 780, ALL, 'English', 'Amina'],
  ['KG-A', null, 645, 690, ALL, 'English', 'Nadia'],
  ['KG-A', null, 690, 735, ALL, 'Bangla', 'Maryam'],
  ['KG-A', null, 735, 780, ALL, 'Math', 'Jamila'],
  ['KG-B', null, 645, 690, ALL, 'Math', 'Science-1'],
  ['KG-B', null, 690, 735, ALL, 'English', 'Kamal'],
  ['KG-B', null, 735, 780, ALL, 'Bangla', 'Maryam'],
  ['One-A', null, 645, 690, ALL, 'English', 'Amina'],
  ['One-A', null, 690, 735, ALL, 'Bangla', 'Farzana'],
  ['One-A', null, 735, 780, ALL, 'Math', 'Science-1'],
  ['Two (M)', null, 645, 690, ALL, 'Islam', 'Hasan'],
  ['Two (M)', null, 690, 735, ALL, 'Math', 'Nadia'],
  ['Two (M)', null, 735, 780, ALL, 'English', 'Kamal'],
  ['Two (F)', null, 645, 690, ALL, 'Bangla', 'Maryam'],
  ['Two (F)', null, 690, 735, ALL, 'Islam', 'Hasan'],
  ['Two (F)', null, 735, 780, ALL, 'Math', 'Nadia', 'Lubna'],
  // A general lesson in the old Arabic time.
  ['Three (M)', null, 600, 645, ALL, 'Math', 'Jamila'],
  ['Three (M)', null, 735, 780, ALL, 'Islam', 'Bilal'],
  // A class on its own times.
  ['Six (F)', null, 420, 480, ALL, 'Bangla', 'Farzana'],
  ['Six (F)', null, 540, 600, ALL, 'English', 'Kamal'],
  ['Six (F)', null, 690, 735, ALL, 'Science', 'Science-1'],
];

const must = <T extends { ok: boolean }>(what: string, r: T) => {
  if (!r.ok) throw new Error(`${what}: ${JSON.stringify(r)}`);
  return r as T & { id: string };
};

export async function loadRoutineFixtures(): Promise<string> {
  const db = getRoutineDb();
  await db.execute(sql`TRUNCATE routine_routines, routine_subjects, routine_rooms, routine_groups, routine_teachers, routine_absences, routine_proxies CASCADE`);
  const types = new Map((await listTypes()).map((t) => [t.name, t.id]));
  for (const [type, names] of Object.entries(SUBJECTS)) {
    for (const [i, name] of names.entries()) must(name, await saveSubject({ typeId: types.get(type)!, name, sort: i * 10, active: true }));
  }
  for (const name of new Set(GROUPS.flatMap(([, , room]) => (room ? [room] : [])))) must(name, await saveRoom({ name }));
  const rooms = new Map((await db.execute<{ id: string; name: string }>(sql`select id, name from routine_rooms`)).rows.map((r) => [r.name, r.id]));
  for (const [i, [name, type, room, genderRule]] of GROUPS.entries()) {
    must(name, await saveGroup({ name, typeId: types.get(type)!, sort: i * 10, defaultRoomId: room ? rooms.get(room)! : null, genderRule, active: true }));
  }
  const subjects = await listSubjects();
  for (const [shortName, fullName, gender, subs, targetPeriods, salary, isVacancy] of TEACHERS) {
    const input: TeacherInput = {
      fullName,
      shortName,
      gender,
      designation: isVacancy ? '' : 'সহকারী শিক্ষক',
      department: '',
      qualification: '',
      experienceYears: null,
      phone: '',
      salary,
      targetPeriods,
      bio: '',
      erpId: null,
      isVacancy: !!isVacancy,
      active: true,
      subjectIds: subjects.filter((s) => subs.includes(s.name)).map((s) => s.id),
    };
    must(shortName, await saveTeacher(input));
  }
  const routineId = must('routine', await createRoutine('২০২৭')).id;
  must('activate', await activateRoutine(routineId));
  const groups = new Map((await listGroups()).map((g) => [g.name, g]));
  const teachers = new Map((await listTeachers()).map((t) => [t.shortName, t.id]));
  for (const [group, host, startsAt, endsAt, days, subject, teacher, ta] of LESSONS) {
    const g = groups.get(group)!;
    const subjectId = subjects.find((s) => s.typeId === g.typeId && s.name === subject)!.id;
    must(`${group} ${startsAt}`, await saveAssignment(
      routineId,
      { groupId: g.id, hostGroupId: host ? groups.get(host)!.id : null, startsAt, endsAt, days, subjectId, teacherId: teachers.get(teacher)!, taId: ta ? teachers.get(ta)! : null },
      true,
    ));
  }
  const today = dhakaToday();
  if (dayOfDate(today) !== null) must('absence', await saveAbsence(today, teachers.get('Jamila')!, null, 'ছুটি'));
  return `sample routine loaded (${LESSONS.length} classes, ${TEACHERS.length} teachers).`;
}
