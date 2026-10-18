import 'server-only';
import { sql } from 'drizzle-orm';
import { createRoutine, activateRoutine, listGroups, listSubjects, listTeachers, routineData, pickRoutine, saveAbsence, saveAssignment, saveGroup, savePeriod, saveRoom, saveSubject, saveTeacher, type TeacherInput } from '../data';
import { dayOfDate, dhakaToday } from '../days';
import { getRoutineDb } from '../db';

/**
 * A sample routine for the local preview (ADMISSIONS_LOCAL=1), shaped like the school's sheet:
 * class sections, Quran and Arabic level groups, a shared hall, day-split cells, a TA, a vacancy
 * and one teacher away today. Names are made up. Replaces every routine row it finds.
 */

const SUBJECTS = ['Bangla', 'English', 'Math', 'Science', 'Islam', 'Arabic', 'Quran', 'Hifz', 'Arts'];
const ROOMS: [string, boolean][] = [['201', false], ['202', false], ['203', false], ['402', false], ['403', false], ['501', false], ['502', false], ['Hall', true]];

// name, section, room, gender rule, kind
const GROUPS: [string, string, string | null, 'any' | 'male' | 'female', 'section' | 'level'][] = [
  ['Nursery-A', 'জেনারেল', '402', 'any', 'section'],
  ['Nursery-B', 'জেনারেল', '403', 'any', 'section'],
  ['KG-A', 'জেনারেল', '201', 'any', 'section'],
  ['One-A', 'জেনারেল', '501', 'any', 'section'],
  ['Two (M)', 'জেনারেল', '203', 'male', 'section'],
  ['Two (F)', 'জেনারেল', '502', 'female', 'section'],
  ['Five (M)', 'জেনারেল', 'Hall', 'male', 'section'],
  ['Five (F)', 'জেনারেল', 'Hall', 'female', 'section'],
  ['Qaida-A', 'কুরআন', '402', 'any', 'level'],
  ['Qaida-B', 'কুরআন', '403', 'any', 'level'],
  ['Ammapara-1', 'কুরআন', '201', 'any', 'level'],
  ['Hifz (M)', 'হিফয', '203', 'male', 'level'],
  ['Hifz (F)', 'হিফয', '502', 'female', 'level'],
  ['Arabic L-1', 'আরবি', '402', 'any', 'level'],
  ['Arabic L-2', 'আরবি', '201', 'any', 'level'],
  ['Arabic L-3', 'আরবি', '501', 'any', 'level'],
];

// short name, full name, gender, subjects, target, salary, vacancy
const TEACHERS: [string, string, 'male' | 'female', string[], number | null, number | null, boolean?][] = [
  ['Amina', 'আমিনা খাতুন', 'female', ['English', 'Math'], 18, 20000],
  ['Bilal', 'হাফেজ বিলাল হোসেন', 'male', ['Quran', 'Arabic', 'Hifz'], 16, 25000],
  ['Farzana', 'ফারজানা ইসলাম', 'female', ['Bangla', 'Islam'], 18, 18000],
  ['Hasan', 'মাওলানা হাসান আলী', 'male', ['Quran', 'Arabic', 'Islam'], 16, 22000],
  ['Jamila', 'জামিলা আক্তার', 'female', ['Math', 'Science'], 18, 20000],
  ['Kamal', 'কামাল উদ্দিন', 'male', ['English', 'Bangla'], 18, 20000],
  ['Lubna', 'লুবনা রহমান', 'female', ['Quran', 'Islam'], 14, 15000],
  ['Maryam', 'মারইয়াম সুলতানা', 'female', ['Arabic', 'Bangla'], 16, 18000],
  ['Nadia', 'নাদিয়া হক', 'female', ['English', 'Arts'], 14, 15000],
  ['Omar', 'হাফেজ ওমর ফারুক', 'male', ['Hifz', 'Quran'], 12, 30000],
  ['Sadia', 'হাফেজা সাদিয়া', 'female', ['Hifz', 'Quran'], 12, 20000],
  ['Science-1', 'বিজ্ঞান শিক্ষক (নিয়োগ বাকি)', 'male', ['Science', 'Math'], 18, null, true],
];

// group, period index, days, subject, teacher, TA
const ALL = [0, 1, 2, 3, 4, 5];
const ASSIGN: [string, number, number[], string, string, string?][] = [
  ['Hifz (M)', 0, ALL, 'Hifz', 'Omar', 'Bilal'],
  ['Hifz (F)', 0, ALL, 'Hifz', 'Sadia'],
  ['Hifz (M)', 1, ALL, 'Hifz', 'Omar'],
  ['Hifz (F)', 1, ALL, 'Hifz', 'Sadia'],
  ['Qaida-A', 2, ALL, 'Quran', 'Lubna'],
  ['Qaida-B', 2, ALL, 'Quran', 'Hasan'],
  ['Ammapara-1', 2, ALL, 'Quran', 'Bilal'],
  ['Arabic L-1', 3, [1, 2, 3], 'Arabic', 'Maryam'],
  ['Arabic L-1', 3, [4, 5], 'Islam', 'Lubna'],
  ['Arabic L-2', 3, ALL, 'Arabic', 'Hasan'],
  ['Arabic L-3', 3, ALL, 'Arabic', 'Bilal'],
  ['Nursery-A', 4, ALL, 'Math', 'Jamila'],
  ['Nursery-A', 5, ALL, 'English', 'Amina'],
  ['Nursery-A', 6, ALL, 'Bangla', 'Farzana'],
  ['Nursery-B', 4, ALL, 'Bangla', 'Kamal'],
  ['Nursery-B', 5, ALL, 'Math', 'Science-1'],
  ['KG-A', 4, ALL, 'English', 'Nadia'],
  ['KG-A', 5, ALL, 'Bangla', 'Maryam'],
  ['One-A', 4, [0, 1, 2], 'Islam', 'Farzana'],
  ['One-A', 4, [3, 4, 5], 'Science', 'Science-1'],
  ['One-A', 5, ALL, 'English', 'Kamal'],
  ['Two (M)', 5, ALL, 'Islam', 'Hasan'],
  ['Two (M)', 6, ALL, 'Math', 'Science-1'],
  ['Two (F)', 4, ALL, 'English', 'Amina', 'Maryam'],
  ['Two (F)', 6, ALL, 'Islam', 'Lubna'],
  ['Five (M)', 6, ALL, 'English', 'Kamal'],
  ['Five (F)', 5, ALL, 'Science', 'Jamila'],
  ['Hifz (M)', 7, [0, 1, 2, 3, 4], 'Hifz', 'Omar'],
  ['Hifz (F)', 7, [0, 1, 2, 3, 4], 'Hifz', 'Sadia'],
];

// start, end (minutes), label
const PERIODS: [number, number, string][] = [
  [420, 495, 'হিফয'],
  [495, 540, 'হিফয'],
  [540, 585, 'কুরআন'],
  [600, 645, 'আরবি'],
  [645, 690, ''],
  [690, 735, ''],
  [735, 780, ''],
  [900, 1200, 'হিফয (বিকেল)'],
];

const must = <T extends { ok: boolean }>(what: string, r: T) => {
  if (!r.ok) throw new Error(`${what}: ${JSON.stringify(r)}`);
  return r as T & { id: string };
};

export async function loadRoutineFixtures(): Promise<string> {
  const db = getRoutineDb();
  await db.execute(sql`TRUNCATE routine_routines, routine_subjects, routine_rooms, routine_groups, routine_teachers, routine_absences, routine_proxies CASCADE`);
  for (const [i, name] of SUBJECTS.entries()) must(name, await saveSubject({ name, sort: i * 10, active: true }));
  const rooms = new Map<string, string>();
  for (const [name, shared] of ROOMS) rooms.set(name, must(name, await saveRoom({ name, shared })).id);
  for (const [i, [name, section, room, genderRule, kind]] of GROUPS.entries()) {
    must(name, await saveGroup({ name, section, kind, sort: i * 10, defaultRoomId: room ? rooms.get(room)! : null, genderRule, active: true }));
  }
  const subjects = new Map((await listSubjects()).map((s) => [s.name, s.id]));
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
      subjectIds: subs.map((s) => subjects.get(s)!),
    };
    must(shortName, await saveTeacher(input));
  }
  const routineId = must('routine', await createRoutine('২০২৭')).id;
  for (const [startsAt, endsAt, label] of PERIODS) must(label, await savePeriod(routineId, { label, startsAt, endsAt }));
  must('activate', await activateRoutine(routineId));
  const data = await routineData((await pickRoutine(routineId))!);
  const groups = new Map((await listGroups()).map((g) => [g.name, g.id]));
  const teachers = new Map((await listTeachers()).map((t) => [t.shortName, t.id]));
  for (const [group, period, days, subject, teacher, ta] of ASSIGN) {
    must(`${group} ${period}`, await saveAssignment(
      routineId,
      { groupId: groups.get(group)!, periodId: data.periods[period].id, days, subjectId: subjects.get(subject)!, teacherId: teachers.get(teacher)!, taId: ta ? teachers.get(ta)! : null, roomId: null, note: '' },
      true,
    ));
  }
  const today = dhakaToday();
  if (dayOfDate(today) !== null) must('absence', await saveAbsence(today, teachers.get('Jamila')!, null, 'ছুটি'));
  return `sample routine loaded (${ASSIGN.length} classes, ${TEACHERS.length} teachers).`;
}
