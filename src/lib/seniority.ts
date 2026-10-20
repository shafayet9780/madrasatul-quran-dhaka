/**
 * Seniority ranking for directors & teachers.
 *
 * Drives list ordering (rank, then the Studio's drag order) and an optional card badge.
 * Lower number = more senior. Unknown/undefined ranks after all named roles
 * so unranked profiles fall back to the drag order among themselves.
 */
const RANK: Record<string, number> = {
  chairman: 1,
  principal: 2,
  vice_principal: 3,
  director: 4,
  advisor: 5,
  head_of_department: 6,
  senior_teacher: 7,
  teacher: 8,
  assistant_teacher: 9,
};

const UNRANKED = 999;

/** Baseline role that should NOT show a badge (every plain teacher would, otherwise). */
const NO_BADGE = new Set(['teacher']);

export function rankOf(seniority?: string | null): number {
  if (!seniority) return UNRANKED;
  return RANK[seniority] ?? UNRANKED;
}

/** The Studio's drag order (`orderRank`, compared as Sanity sorts it); unordered entries last. */
export function compareOrderRank(a?: string, b?: string): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a < b ? -1 : 1;
}

export function sortBySeniority<T extends { seniority?: string; orderRank?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const r = rankOf(a.seniority) - rankOf(b.seniority);
    return r !== 0 ? r : compareOrderRank(a.orderRank, b.orderRank);
  });
}

/** Message key for the seniority badge, or null when no badge should render. */
export function seniorityBadgeKey(seniority?: string | null): string | null {
  if (!seniority || NO_BADGE.has(seniority)) return null;
  return `seniority.${seniority}`;
}
