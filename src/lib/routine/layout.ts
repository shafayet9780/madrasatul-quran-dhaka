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

/** Runs of groups under one band (LEVEL-1: L-1 A, B, C); a group without a band is a run of its own. */
export function bandRuns<G extends Pick<Group, 'band'>>(groups: G[]): { band: string; groups: G[] }[] {
  const runs: { band: string; groups: G[] }[] = [];
  for (const g of groups) {
    const last = runs[runs.length - 1];
    if (last && g.band && last.band === g.band) last.groups.push(g);
    else runs.push({ band: g.band, groups: [g] });
  }
  return runs;
}

export type Lane = Block & {
  /** One period, or every group has the same classes in each: shown as cards, not a table. */
  cards: boolean;
};

/**
 * The sheet view as columns (one per block) plus strips. A group with classes in two or more blocks
 * of other headings runs on its own times (Six (F)) and gets a strip instead; a group with no class
 * yet sits in the column of its heading, so it can be filled in.
 */
export function sheetLayout(periods: Period[], assignments: Assignment[], groups: Group[]): { lanes: Lane[]; strips: Group[] } {
  const blocks = sheetBlocks(periods, assignments, groups);
  const strips = groups.filter((g) => blocks.filter((b) => b.headings[0] !== g.section && b.groups.includes(g)).length >= 2);
  const used = new Set(assignments.map((a) => a.groupId));
  const lanes = blocks.map((b) => {
    const home = groups.filter((g) => g.active && !used.has(g.id) && g.section === b.headings[0] && blocks.find((x) => x.headings[0] === g.section) === b);
    const members = new Set([...b.groups.filter((g) => !strips.includes(g)), ...home]);
    const rows = groups.filter((g) => members.has(g));
    // The same classes in every period: a group's classes per period, as one comparable text.
    const sign = (g: Group, p: Period) =>
      assignments
        .filter((a) => a.groupId === g.id && a.periodId === p.id)
        .map((a) => [a.subjectId, a.teacherId, a.taId, a.roomId, a.days.join(), a.note].join('|'))
        .sort()
        .join('\n');
    const same = rows.every((g) => b.periods.every((p) => sign(g, p) === sign(g, b.periods[0])));
    return { ...b, groups: rows, banded: rows.some((g) => g.band), cards: b.periods.length === 1 || same };
  });
  return { lanes: lanes.filter((l) => l.groups.length), strips };
}

/**
 * The periods a group's day is made of, for one group's list (a strip, the phone): its heading's
 * blocks and any period it has a class in; with neither, every period.
 */
export function groupPeriods(periods: Period[], assignments: Assignment[], groups: Group[], group: Group): Period[] {
  const home = new Set(sheetBlocks(periods, assignments, groups).filter((b) => b.headings[0] === group.section).flatMap((b) => b.periods.map((p) => p.id)));
  const own = periods.filter((p) => home.has(p.id) || assignments.some((a) => a.groupId === group.id && a.periodId === p.id));
  return own.length ? own : periods;
}
