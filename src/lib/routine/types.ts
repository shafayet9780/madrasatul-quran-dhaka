// Plain shapes the routine logic and pages share (docs/class-routine.md §3). Days are 0 = Saturday
// … 5 = Thursday; times are minutes after midnight.

export type Gender = 'male' | 'female';
export type GenderRule = 'any' | Gender;
export type Role = 'main' | 'ta';
/** class: a class row; own_room: a group with its own room and row (Hifz); seated: a group in a class's room (Quran). */
export type Placement = 'class' | 'own_room' | 'seated';

export type TimeSpan = { startsAt: number; endsAt: number };

export type ClassType = { id: string; name: string; placement: Placement; sort: number };
export type Subject = { id: string; typeId: string; name: string; sort: number; active: boolean };
export type Room = { id: string; name: string };

/** A class (Nursery-A) or a group (Hifz-1 (M), Qaida-A). */
export type Group = {
  id: string;
  name: string;
  typeId: string;
  sort: number;
  defaultRoomId: string | null;
  genderRule: GenderRule;
  active: boolean;
};

export type Teacher = {
  id: string;
  fullName: string;
  shortName: string;
  /** null only for a vacancy whose hire isn't known yet. */
  gender: Gender | null;
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

/** One lesson: a class or group at a time on some days. A seated group names its host class. */
export type Assignment = TimeSpan & {
  id: string;
  groupId: string;
  hostGroupId: string | null;
  days: number[];
  subjectId: string;
  teacherId: string;
  taId: string | null;
};

/** Everything one routine needs on a page: its assignments plus the shared lists. */
export type RoutineData = {
  routine: RoutineInfo;
  assignments: Assignment[];
  types: ClassType[];
  groups: Group[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
};
