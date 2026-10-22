// The split tiles of the homepage's education model (the splits come from Studio → Curriculum, src/lib/curriculum/plan.ts).

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
