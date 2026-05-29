import { describe, it, expect } from 'vitest';
import { getDepartments, filterTeachers, groupByDepartment } from './teacher-grouping';
import type { Teacher, Department } from '@/types/sanity';

const dept = (id: string, order: number, en: string): Department => ({
  _id: id,
  _type: 'department',
  name: { bengali: en, english: en },
  slug: { bengali: { current: id }, english: { current: id } },
  displayOrder: order,
});

const islamic = dept('d-islamic', 1, 'Islamic Studies');
const science = dept('d-science', 2, 'Science');

const teacher = (id: string, name: string, d: Department | undefined, extra: Partial<Teacher> = {}): Teacher => ({
  _id: id,
  _type: 'teacher',
  name: { bengali: name, english: name },
  slug: { bengali: { current: id }, english: { current: id } },
  gender: 'male',
  department: d,
  displayOrder: 0,
  ...extra,
});

const teachers: Teacher[] = [
  teacher('t1', 'Ahmed', science, { subjects: { bengali: [], english: ['Physics'] } }),
  teacher('t2', 'Bilal', islamic, { specializations: ['Hifz'] }),
  teacher('t3', 'Carim', islamic),
];

describe('getDepartments', () => {
  it('returns unique departments ordered by displayOrder', () => {
    const result = getDepartments(teachers);
    expect(result.map((d) => d._id)).toEqual(['d-islamic', 'd-science']);
  });
});

describe('filterTeachers', () => {
  it('filters by department', () => {
    const result = filterTeachers(teachers, { departmentId: 'd-islamic', language: 'english' });
    expect(result.map((t) => t._id)).toEqual(['t2', 't3']);
  });

  it('matches name, subject and specialization', () => {
    expect(filterTeachers(teachers, { query: 'phys', language: 'english' }).map((t) => t._id)).toEqual(['t1']);
    expect(filterTeachers(teachers, { query: 'hifz', language: 'english' }).map((t) => t._id)).toEqual(['t2']);
    expect(filterTeachers(teachers, { query: 'carim', language: 'english' }).map((t) => t._id)).toEqual(['t3']);
  });

  it('returns all when query empty', () => {
    expect(filterTeachers(teachers, { query: '', language: 'english' })).toHaveLength(3);
  });
});

describe('groupByDepartment', () => {
  it('groups teachers under their department in order, dropping empty groups', () => {
    const groups = groupByDepartment(teachers);
    expect(groups.map((g) => g.department?._id)).toEqual(['d-islamic', 'd-science']);
    expect(groups[0].teachers.map((t) => t._id)).toEqual(['t2', 't3']);
  });

  it('puts department-less teachers in a trailing unassigned group', () => {
    const groups = groupByDepartment([...teachers, teacher('t4', 'Dawud', undefined)]);
    expect(groups[groups.length - 1].department).toBeUndefined();
    expect(groups[groups.length - 1].teachers.map((t) => t._id)).toEqual(['t4']);
  });
});
