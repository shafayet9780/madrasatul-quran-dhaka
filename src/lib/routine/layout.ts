import type { Assignment, Group, Period } from './types';

// Layout of the sheet-style view (docs/class-routine.md §5): the day left to right, cut into blocks
// as the school's sheet is (HIFZ | QURAN | ARABIC | GENERAL | HIFZ). A block is a run of periods
// with classes whose groups belong to the same headings; it lists the groups taught in it.

export type Block = { headings: string[]; periods: Period[]; groups: Group[]; banded: boolean };

/** Blocks of the periods that have classes, in time order (periods arrive sorted by start). */
export function sheetBlocks(periods: Period[], assignments: Assignment[], groups: Group[]): Block[] {
  const blocks: (Block & { key: string; ids: Set<string> })[] = [];
  for (const period of periods) {
    const ids = new Set(assignments.filter((a) => a.periodId === period.id).map((a) => a.groupId));
    if (!ids.size) continue;
    const headings = [...new Set(groups.filter((g) => ids.has(g.id)).map((g) => g.section))];
    const key = [...headings].sort().join('\u0000');
    const last = blocks[blocks.length - 1];
    if (last?.key === key) {
      last.periods.push(period);
      for (const id of ids) last.ids.add(id);
    } else {
      blocks.push({ headings, periods: [period], groups: [], banded: false, key, ids });
    }
  }
  return blocks.map(({ headings, periods: own, ids }) => {
    const rows = groups.filter((g) => ids.has(g.id));
    return { headings, periods: own, groups: rows, banded: rows.some((g) => g.band) };
  });
}

/** Row spans of the band labels: each run of equal bands starts with its length, the rest are 0. */
export function bandSpans(groups: Pick<Group, 'band'>[]): number[] {
  const spans = groups.map(() => 1);
  for (let i = 0; i < groups.length; i++) {
    if (!groups[i].band) continue;
    let j = i;
    while (j + 1 < groups.length && groups[j + 1].band === groups[i].band) j++;
    spans[i] = j - i + 1;
    for (let k = i + 1; k <= j; k++) spans[k] = 0;
    i = j;
  }
  return spans;
}
