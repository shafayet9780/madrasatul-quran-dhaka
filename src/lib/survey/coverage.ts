import { classSections, type RoundSnapshot } from './snapshot';

// T1 coverage for the tracker (R6): class-section × subject, from the round's batches.

export type BatchSummary = {
  id: string;
  status: 'draft' | 'submitted';
  supersededBy: string | null;
  duplicateFlag: boolean;
  teacherName: string | null;
  classKey: string;
  sectionKey: string;
  subjectKey: string;
  updatedAt: Date;
  submittedAt: Date | null;
};

export type CellState = 'done' | 'draft' | 'dup' | 'todo' | 'na';

export type CoverageCell = { subjectKey: string; state: CellState; teachers: string[] };
export type CoverageRow = { classKey: string; sectionKey: string; label: string; cells: CoverageCell[] };

/** Every subject of the round, in first-seen class order (columns). */
export function coverageSubjects(snapshot: RoundSnapshot) {
  const seen = new Map<string, string>();
  for (const cls of snapshot.classes) for (const s of cls.subjects) if (!seen.has(s.key)) seen.set(s.key, s.name);
  return [...seen].map(([key, name]) => ({ key, name }));
}

export function buildCoverage(snapshot: RoundSnapshot, batches: BatchSummary[]) {
  const subjects = coverageSubjects(snapshot);
  const current = batches.filter((b) => b.status === 'submitted' && !b.supersededBy);
  const drafts = batches.filter((b) => b.status === 'draft');
  const at = (list: BatchSummary[], classKey: string, sectionKey: string, subjectKey: string) =>
    list.filter((b) => b.classKey === classKey && b.sectionKey === sectionKey && b.subjectKey === subjectKey);

  const rows: CoverageRow[] = classSections(snapshot).map((place) => {
    const cls = snapshot.classes.find((c) => c.key === place.classKey)!;
    return {
      ...place,
      cells: subjects.map(({ key }) => {
        if (!cls.subjects.some((s) => s.key === key)) return { subjectKey: key, state: 'na' as const, teachers: [] };
        const done = at(current, place.classKey, place.sectionKey, key);
        const pending = at(drafts, place.classKey, place.sectionKey, key);
        // The duplicate flag is the source of truth: "keep all" clears it while both batches stay current.
        const state: CellState = done.some((b) => b.duplicateFlag) ? 'dup' : done.length ? 'done' : pending.length ? 'draft' : 'todo';
        const teachers = [...new Set([...done, ...pending].map((b) => b.teacherName ?? ''))].filter(Boolean).sort((x, y) => x.localeCompare(y, 'bn'));
        return { subjectKey: key, state, teachers };
      }),
    };
  });
  const applicable = rows.flatMap((r) => r.cells).filter((c) => c.state !== 'na');
  return {
    subjects,
    rows,
    covered: applicable.filter((c) => c.state === 'done' || c.state === 'dup').length,
    total: applicable.length,
  };
}

/** Groups of current batches for one class-section + subject that are still flagged as duplicates. */
export function duplicateGroups(batches: BatchSummary[]) {
  const groups = new Map<string, BatchSummary[]>();
  for (const b of batches) {
    if (b.status !== 'submitted' || b.supersededBy) continue;
    const key = `${b.classKey}|${b.sectionKey}|${b.subjectKey}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }
  return [...groups.values()].filter((group) => group.length > 1 && group.some((b) => b.duplicateFlag));
}

/** "Android · Chrome" from a user agent, for the drafts list. */
export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return '';
  const os = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iPhone'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(userAgent)
          ? 'Mac'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /SamsungBrowser/.test(userAgent)
      ? 'Samsung Internet'
      : /Firefox|FxiOS/.test(userAgent)
        ? 'Firefox'
        : /Chrome|CriOS/.test(userAgent)
          ? 'Chrome'
          : /Safari/.test(userAgent)
            ? 'Safari'
            : '';
  return [os, browser].filter(Boolean).join(' · ');
}
