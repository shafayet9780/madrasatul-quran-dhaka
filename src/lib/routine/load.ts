import { minutesOf } from './days';
import type { Assignment, Period, Teacher } from './types';

// Weekly load (docs/class-routine.md §4): every slot is one period whatever its length; a TA period
// counts half towards the status. Under < 80 % of the target, over > 100 %.

export const UNDER = 0.8;
export const OVER = 1;
export const TA_WEIGHT = 0.5;

export type LoadStatus = 'under' | 'ok' | 'over' | 'none';

export type Load = {
  main: number;
  ta: number;
  weighted: number;
  target: number | null;
  percent: number | null;
  status: LoadStatus;
  minutesMain: number;
  minutesTa: number;
  /** Periods (main + TA) on each day, Saturday first. */
  perDay: number[];
};

export const STATUS_LABEL: Record<LoadStatus, string> = { under: 'কম', ok: 'ঠিক আছে', over: 'বেশি', none: 'টার্গেট নেই' };

export function loadStatus(weighted: number, target: number | null): { percent: number | null; status: LoadStatus } {
  if (!target || target <= 0) return { percent: null, status: 'none' };
  const percent = weighted / target;
  return { percent, status: percent < UNDER ? 'under' : percent > OVER ? 'over' : 'ok' };
}

/** Load of every teacher in the list (a teacher with no assignments has zeros). */
export function teacherLoads(teachers: Pick<Teacher, 'id' | 'targetPeriods'>[], assignments: Assignment[], periods: Period[]): Map<string, Load> {
  const minutes = new Map(periods.map((p) => [p.id, minutesOf(p)]));
  const loads = new Map<string, Load>();
  for (const t of teachers) {
    loads.set(t.id, { main: 0, ta: 0, weighted: 0, target: t.targetPeriods, percent: null, status: 'none', minutesMain: 0, minutesTa: 0, perDay: [0, 0, 0, 0, 0, 0] });
  }
  for (const a of assignments) {
    const days = new Set(a.days);
    const length = minutes.get(a.periodId) ?? 0;
    for (const [id, role] of [[a.teacherId, 'main'], [a.taId, 'ta']] as const) {
      const load = id ? loads.get(id) : undefined;
      if (!load) continue;
      if (role === 'main') {
        load.main += days.size;
        load.minutesMain += days.size * length;
      } else {
        load.ta += days.size;
        load.minutesTa += days.size * length;
      }
      for (const d of days) load.perDay[d] += 1;
    }
  }
  for (const load of loads.values()) {
    load.weighted = load.main + TA_WEIGHT * load.ta;
    Object.assign(load, loadStatus(load.weighted, load.target));
  }
  return loads;
}

/** The days with the most periods (all of them when tied), or null when the teacher has none. */
export function busiestDays(load: Load): { days: number[]; count: number } | null {
  const count = Math.max(...load.perDay);
  return count > 0 ? { days: load.perDay.flatMap((n, d) => (n === count ? [d] : [])), count } : null;
}

/** Monthly salary per period taught: salary ÷ (weighted periods a week × 52 ÷ 12). */
export function salaryPerPeriod(salary: number | null, weighted: number): number | null {
  if (!salary || weighted <= 0) return null;
  return Math.round(salary / ((weighted * 52) / 12));
}
