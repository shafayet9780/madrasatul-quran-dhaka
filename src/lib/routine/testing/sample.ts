import type { Assignment, Group, Period, Room, Subject, Teacher } from '../types';

// Small hand-made lists for the pure-logic tests.

export const subject = (id: string, name = id): Subject => ({ id, name, sort: 0, active: true });
export const room = (id: string, shared = false): Room => ({ id, name: id, shared });

export const group = (id: string, extra: Partial<Group> = {}): Group => ({
  id,
  name: id,
  kind: 'section',
  section: 'জেনারেল',
  band: '',
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

export const period = (id: string, startsAt: number, endsAt: number, label = ''): Period => ({ id, label, startsAt, endsAt });

let n = 0;
export const assignment = (extra: Partial<Assignment> & Pick<Assignment, 'groupId' | 'periodId' | 'teacherId'>): Assignment => ({
  id: `a${++n}`,
  days: [0, 1, 2, 3, 4, 5],
  subjectId: 'math',
  taId: null,
  roomId: null,
  note: '',
  ...extra,
});
