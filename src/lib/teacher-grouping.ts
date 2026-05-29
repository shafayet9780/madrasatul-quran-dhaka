import type { Teacher, Department } from '@/types/sanity';
import { getLocalizedText, getLocalizedArray, type Language } from '@/lib/sanity-utils';

const UNASSIGNED = '__unassigned__';

/** Unique departments present in a teacher list, ordered by displayOrder then English name. */
export function getDepartments(teachers: Teacher[]): Department[] {
  const map = new Map<string, Department>();
  for (const teacher of teachers) {
    if (teacher.department?._id && !map.has(teacher.department._id)) {
      map.set(teacher.department._id, teacher.department);
    }
  }
  return [...map.values()].sort((a, b) => {
    const order = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    return order !== 0 ? order : (a.name?.english ?? '').localeCompare(b.name?.english ?? '');
  });
}

/** Filter by free-text search (name, subjects, specializations) and optional department. */
export function filterTeachers(
  teachers: Teacher[],
  opts: { query?: string; departmentId?: string | null; language: Language }
): Teacher[] {
  const query = (opts.query ?? '').trim().toLowerCase();
  return teachers.filter((teacher) => {
    if (opts.departmentId && teacher.department?._id !== opts.departmentId) return false;
    if (!query) return true;

    const haystack = [
      getLocalizedText(teacher.name, opts.language),
      getLocalizedText(teacher.designation, opts.language),
      ...getLocalizedArray(teacher.subjects, opts.language),
      ...(teacher.specializations ?? []),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

/** Group teachers by department, preserving department display order. */
export function groupByDepartment(
  teachers: Teacher[]
): Array<{ department?: Department; teachers: Teacher[] }> {
  const departments = getDepartments(teachers);
  const groups: Array<{ department?: Department; teachers: Teacher[] }> = departments.map((d) => ({
    department: d,
    teachers: [],
  }));
  const byId = new Map(groups.map((g) => [g.department!._id, g]));
  const unassigned: Teacher[] = [];

  for (const teacher of teachers) {
    const id = teacher.department?._id ?? UNASSIGNED;
    const group = byId.get(id);
    if (group) group.teachers.push(teacher);
    else unassigned.push(teacher);
  }

  if (unassigned.length > 0) groups.push({ department: undefined, teachers: unassigned });
  return groups.filter((g) => g.teachers.length > 0);
}
