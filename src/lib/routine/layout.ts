import type { Assignment, Group, Period } from './types';

// Layout of the sheet-style view (docs/class-routine.md §5): the day left to right, cut into blocks
// as the school's sheet is (HIFZ | QURAN | ARABIC | GENERAL | HIFZ). A block is a run of periods
// whose classes are mostly under the same heading; it lists every group taught in it, so a group on
// its own timetable (Six (F) at 8:15) is a row of that block, as at the bottom of the sheet.

export type Block = { headings: string[]; periods: Period[]; groups: Group[]; banded: boolean };

/** Blocks of the periods that have classes, in time order (periods arrive sorted by start). */
export function sheetBlocks(periods: Period[], assignments: Assignment[], groups: Group[]): Block[] {
  const blocks: (Block & { key: string; ids: Set<string> })[] = [];
  for (const period of periods) {
    const ids = new Set(assignments.filter((a) => a.periodId === period.id).map((a) => a.groupId));
    if (!ids.size) continue;
    const count = new Map<string, number>();
    for (const g of groups.filter((x) => ids.has(x.id))) count.set(g.section, (count.get(g.section) ?? 0) + 1);
    const top = Math.max(...count.values());
    const leading = [...count].filter(([, n]) => n === top).map(([section]) => section);
    const last = blocks[blocks.length - 1];
    // A tie keeps the block going (one Hifz group and Six (F) at 8:15 stay in the Hifz block).
    const key = last && leading.includes(last.key) ? last.key : leading[0];
    const headings = [key];
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
