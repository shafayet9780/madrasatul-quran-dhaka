import type { Assignment, ClassType, Subject, Teacher } from './types';

// Subjects and who teaches them, for the routine page's "সাবজেক্টের টিচার" panel and the টিচার view.

/** Each subject's name; a name in two types (Islam) says which: "Islam (আরবি)". */
export function subjectLabels(subjects: Subject[], types: ClassType[]): Map<string, string> {
  const twice = new Set(subjects.filter((s, i) => subjects.findIndex((x) => x.name === s.name) !== i).map((s) => s.name));
  return new Map(subjects.map((s) => [s.id, twice.has(s.name) ? `${s.name} (${types.find((t) => t.id === s.typeId)?.name ?? ''})` : s.name]));
}

export type SubjectTeachers = { subject: Subject; teachers: Teacher[]; lessons: number };

/**
 * The active subjects under their type (types in order, then subjects), each with the active
 * teachers listing it (open posts too, by short name) and its lessons a week in this routine (a row
 * on three days is three). Types with no active subject are left out.
 */
export function subjectsByType(data: { types: ClassType[]; subjects: Subject[]; teachers: Teacher[]; assignments: Assignment[] }): { type: ClassType; subjects: SubjectTeachers[] }[] {
  const teachers = data.teachers.filter((t) => t.active).sort((a, b) => a.shortName.localeCompare(b.shortName));
  return [...data.types]
    .sort((a, b) => a.sort - b.sort)
    .map((type) => ({
      type,
      subjects: data.subjects
        .filter((s) => s.active && s.typeId === type.id)
        .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
        .map((subject) => ({
          subject,
          teachers: teachers.filter((t) => t.subjectIds.includes(subject.id)),
          lessons: data.assignments.filter((a) => a.subjectId === subject.id).reduce((n, a) => n + a.days.length, 0),
        })),
    }))
    .filter((t) => t.subjects.length);
}
