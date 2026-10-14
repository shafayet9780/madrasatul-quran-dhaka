// The homepage's education model and ten-year plan, from the prospectus. Labels live in messages (home.model, home.plan).

/** Classes are indexed 0 to 12: Nursery, KG, Class 1 … Class 10, Class 11. Each stage is a range [from, to). */
export const STAGE_CLASSES: [number, number][] = [
  [0, 3], // Pre-Hifz: Nursery to Class 1
  [3, 7], // Hifz day-care: Classes 2 to 5
  [7, 10], // After-Hifz: Classes 6 to 8
  [10, 12], // Dakhil: Classes 9 and 10
  [12, 13], // Mutawassita: Class 11
];

/** Dakhil and Mutawassita follow the madrasa board in every subject, so the map shows them as one block each. */
export const BOARD_STAGES = [3, 4];

export type Strand = 'quran' | 'arabic' | 'islam' | 'general';

/** The four strands from Nursery (the Quran to Class 5, the others to Class 8). A segment covers classes [from, to); `label` is a key in home.plan.segments. */
export const STRANDS: { strand: Strand; segments: { from: number; to: number; label: string }[] }[] = [
  {
    strand: 'quran',
    segments: [
      { from: 0, to: 1, label: 'qaida' },
      { from: 1, to: 2, label: 'ammapara' },
      { from: 2, to: 3, label: 'nazera' },
      { from: 3, to: 4, label: 'hifz1' },
      { from: 4, to: 5, label: 'hifz2' },
      { from: 5, to: 6, label: 'hifz3' },
      { from: 6, to: 7, label: 'shunani' },
    ],
  },
  { strand: 'arabic', segments: [{ from: 0, to: 10, label: 'arabic' }] },
  {
    strand: 'islam',
    segments: [
      { from: 0, to: 7, label: 'islam' },
      { from: 7, to: 10, label: 'islamInArabic' },
    ],
  },
  {
    strand: 'general',
    segments: [
      { from: 0, to: 6, label: 'general' },
      { from: 6, to: 7, label: 'science' }, // science is added in Class 5
      { from: 7, to: 10, label: 'bgs' },
    ],
  },
];

/** Where the lanes end (after Class 8): each lane draws over this length. */
export const STRAND_END = 10;

/** Cuts a segment where stages meet: on phones each stage heads its own rows, so a segment cannot run across one. */
export function splitAtStages(from: number, to: number): [number, number][] {
  return STAGE_CLASSES.filter(([a, b]) => a < to && b > from).map(([a, b]) => [Math.max(a, from), Math.min(b, to)]);
}

/**
 * The sourced subject splits of the first three stages, in three slots: Quran, Arabic, general.
 * After-Hifz is counted as Arabic and Islamic together against general, so its Quran slot is empty.
 */
export const STAGE_SPLITS: { split: [number, number, number]; arabicIslam?: boolean }[] = [
  { split: [25, 25, 50] },
  { split: [70, 15, 15] },
  { split: [0, 50, 50], arabicIslam: true },
];

/**
 * Where each slot sits in a row of tiles with `gap` px between the tiles that show: `start` and `size` are
 * fractions of the row less its gaps, `offset` is the gaps before the slot in px. Empty slots take no gap.
 */
export function tileGeometry(split: number[], gap: number) {
  const shown = split.filter((p) => p > 0).length;
  const gaps = Math.max(0, shown - 1) * gap;
  let before = 0;
  let shownBefore = 0;
  return split.map((p) => {
    const tile = { start: before / 100, size: p / 100, offset: shownBefore * gap, gaps };
    before += p;
    if (p > 0) shownBefore += 1;
    return tile;
  });
}
