import type { Assignment, ClassType, Group, Placement, Room, Subject, Teacher } from '../types';

// Small hand-made lists for the pure-logic tests.

export const type = (id: string, placement: Placement, sort = 0, name = id): ClassType => ({ id, name, placement, sort });
/** The five types the migration seeds. */
export const TYPES = [type('general', 'class', 0, 'জেনারেল'), type('hifz', 'own_room', 1, 'হিফয'), type('najera', 'own_room', 2, 'নাজেরা'), type('quran', 'seated', 3, 'কুরআন'), type('arabic', 'seated', 4, 'আরবি')];
export const subject = (id: string, typeId = 'general', name = id): Subject => ({ id, typeId, name, sort: 0, active: true });
export const room = (id: string): Room => ({ id, name: id });

export const group = (id: string, extra: Partial<Group> = {}): Group => ({
  id,
  name: id,
  typeId: 'general',
  sort: 0,
  defaultRoomId: null,
  genderRule: 'any',
  active: true,
  ...extra,
});

export const teacher = (id: string, extra: Partial<Teacher> = {}): Teacher => ({
  id,
  fullName: id,
  shortName: id,
  gender: 'female',
  designation: '',
  department: '',
  qualification: '',
  experienceYears: null,
  phone: '',
  salary: null,
  targetPeriods: null,
  bio: '',
  erpId: null,
  isVacancy: false,
  active: true,
  subjectIds: [],
  ...extra,
});

let n = 0;
/** A lesson at 9:00–9:45 every day unless told otherwise. */
export const assignment = (extra: Partial<Assignment> & Pick<Assignment, 'groupId' | 'teacherId'>): Assignment => ({
  id: `a${++n}`,
  hostGroupId: null,
  startsAt: 540,
  endsAt: 585,
  days: [0, 1, 2, 3, 4, 5],
  subjectId: 'math',
  taId: null,
  ...extra,
});
