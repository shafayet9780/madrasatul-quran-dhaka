import type { Locale } from '@/lib/i18n';
import type { SchoolStatistics } from '@/types/sanity';
import { num } from '@/lib/admissions/display';

/** A count read as a floor with "+": steps of 10 from 100, of 5 below (130 → 130, 28 → 25). */
export function floorStep(n: number): number {
  const step = n >= 100 ? 10 : 5;
  return Math.floor(n / step) * step;
}

export type Stat = {
  /** As printed, in the page's digits. */
  value: string;
  label: string;
  /** For the count-up: the number it ends on; absent for values that do not count (a ratio, a CMS string). */
  countTo?: number;
};

type Labels = { students: string; teachers: string; ratio: string };

/**
 * The numbers band, from Studio → Homepage: students and teachers as floors, the ratio from the exact
 * values, then each achievement as the CMS has it.
 */
export function homeStats(statistics: SchoolStatistics | undefined, locale: Locale, labels: Labels): Stat[] {
  const stats: Stat[] = [];
  const students = statistics?.totalStudents;
  const teachers = statistics?.teacherCount;
  if (students && students > 0) stats.push({ value: `${num(floorStep(students), locale)}+`, label: labels.students, countTo: floorStep(students) });
  if (teachers && teachers > 0) stats.push({ value: `${num(floorStep(teachers), locale)}+`, label: labels.teachers, countTo: floorStep(teachers) });
  if (students && teachers && students > 0 && teachers > 0) {
    stats.push({ value: `${num(1, locale)}:${num(Math.round(students / teachers), locale)}`, label: labels.ratio });
  }
  for (const a of statistics?.achievements ?? []) {
    const label = a.title?.[locale]?.trim();
    const value = a.value?.trim();
    if (label && value) stats.push({ value: num(value, locale), label });
  }
  return stats;
}
