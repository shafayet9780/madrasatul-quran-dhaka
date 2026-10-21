import { rowOf } from './clash';
import { distinctTimes, sameTime } from './days';
import type { Assignment, ClassType, Group, Placement, TimeSpan } from './types';

// Rows of the routine page (docs/class-routine.md §5). টেবিল: a row per room as in the school's
// sheet — the own-room groups (Hifz, Najera) first, split by gender, then the classes; a seated group
// (Quran, Arabic) shows in the row of the class whose room it uses. গ্রুপ: a row per class or group
// under its type. Columns are the routine's distinct times either way.

export type Section = { key: string; title: string; groups: Group[] };

const PLACEMENT_ORDER: Placement[] = ['own_room', 'seated', 'class'];

/** Active groups, and inactive ones that still have lessons, in their type's then their own order. */
function listed(types: ClassType[], groups: Group[], assignments: Assignment[]): Group[] {
  const used = new Set(assignments.flatMap((a) => [a.groupId, rowOf(a)]));
  const typeSort = new Map(types.map((t) => [t.id, t.sort]));
  return groups
    .filter((g) => g.active || used.has(g.id))
    .sort((a, b) => (typeSort.get(a.typeId) ?? 0) - (typeSort.get(b.typeId) ?? 0) || a.sort - b.sort || a.name.localeCompare(b.name));
}

const GENDER_TITLE = { male: ' (M)', female: ' (F)', any: '' } as const;
const GENDER_ORDER = ['male', 'female', 'any'];

/** টেবিল: own-room groups by gender (M, F, then any), then the classes. */
export function tableSections(types: ClassType[], groups: Group[], assignments: Assignment[]): Section[] {
  const placement = new Map(types.map((t) => [t.id, t.placement]));
  const rows = listed(types, groups, assignments);
  const own = rows.filter((g) => placement.get(g.typeId) === 'own_room');
  const ownTitle = types.filter((t) => t.placement === 'own_room' && own.some((g) => g.typeId === t.id)).map((t) => t.name).join(' · ');
  const sections: Section[] = (GENDER_ORDER as (keyof typeof GENDER_TITLE)[])
    .map((rule) => ({ key: `own-${rule}`, title: ownTitle + GENDER_TITLE[rule], groups: own.filter((g) => g.genderRule === rule) }))
    .filter((s) => s.groups.length);
  const classes = rows.filter((g) => placement.get(g.typeId) === 'class');
  if (classes.length) sections.push({ key: 'classes', title: 'ক্লাস', groups: classes });
  return sections;
}

/** গ্রুপ: every type with its classes or groups — own-room types, then seated, then classes. */
export function groupSections(types: ClassType[], groups: Group[], assignments: Assignment[]): Section[] {
  const rows = listed(types, groups, assignments);
  return [...types]
    .sort((a, b) => PLACEMENT_ORDER.indexOf(a.placement) - PLACEMENT_ORDER.indexOf(b.placement) || a.sort - b.sort)
    .map((t) => {
      const mine = rows.filter((g) => g.typeId === t.id);
      // Hifz and Najera list the boys' groups, then the girls', as the টেবিল does.
      if (t.placement === 'own_room') mine.sort((a, b) => GENDER_ORDER.indexOf(a.genderRule) - GENDER_ORDER.indexOf(b.genderRule));
      return { key: t.id, title: t.placement === 'class' ? `${t.name} ক্লাস` : `${t.name} গ্রুপ`, groups: mine };
    })
    .filter((s) => s.groups.length);
}

/** The lessons in one cell: a row's lessons at a time (by room for টেবিল, by group for গ্রুপ), earliest day first. */
export function cellLessons(assignments: Assignment[], groupId: string, time: TimeSpan, by: 'room' | 'group', day: number | null = null): Assignment[] {
  return assignments
    .filter((a) => (by === 'room' ? rowOf(a) : a.groupId) === groupId && sameTime(a, time) && (day === null || a.days.includes(day)))
    .sort((a, b) => Math.min(...a.days) - Math.min(...b.days));
}

/** The table's columns: every distinct lesson time of the routine. */
export const columns = (assignments: Assignment[]) => distinctTimes(assignments);
