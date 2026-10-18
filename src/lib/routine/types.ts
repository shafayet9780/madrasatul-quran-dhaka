// Plain shapes the routine logic and pages share (docs/class-routine.md §3). Days are 0 = Saturday
// … 5 = Thursday; times are minutes after midnight.

export type Gender = 'male' | 'female';
export type GenderRule = 'any' | Gender;
export type GroupKind = 'section' | 'level';
export type Role = 'main' | 'ta';

export type Subject = { id: string; name: string; sort: number; active: boolean };
export type Room = { id: string; name: string; shared: boolean };

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  section: string;
  band: string;
  sort: number;
  defaultRoomId: string | null;
  genderRule: GenderRule;
  active: boolean;
};

export type Teacher = {
  id: string;
  fullName: string;
  shortName: string;
  gender: Gender;
  designation: string;
  department: string;
  qualification: string;
  experienceYears: number | null;
  phone: string;
  salary: number | null;
  targetPeriods: number | null;
  bio: string;
  erpId: string | null;
  isVacancy: boolean;
  active: boolean;
  subjectIds: string[];
};

export type RoutineInfo = { id: string; name: string; status: 'draft' | 'active'; createdAt: string };
export type Period = { id: string; label: string; startsAt: number; endsAt: number };

export type Assignment = {
  id: string;
  groupId: string;
  periodId: string;
  days: number[];
  subjectId: string;
  teacherId: string;
  taId: string | null;
  roomId: string | null;
  note: string;
};

/** Everything one routine needs on a page: its periods and assignments plus the shared lists. */
export type RoutineData = {
  routine: RoutineInfo;
  periods: Period[];
  assignments: Assignment[];
  groups: Group[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
};
