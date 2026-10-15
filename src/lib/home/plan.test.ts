import { describe, expect, it } from 'vitest';
import { BOARD_BLOCKS, STAGE_CLASSES, STAGE_SPLITS, STRANDS, STRAND_END, splitAtStages, tileGeometry } from './plan';

describe('the plan data', () => {
  it('has three stages that cover the 13 classes once, in order', () => {
    expect(STAGE_CLASSES.flatMap(([a, b]) => Array.from({ length: b - a }, (_, i) => a + i))).toEqual([...Array(13).keys()]);
  });

  it('has board blocks inside the last stage, after the lanes end', () => {
    const [from, to] = STAGE_CLASSES.at(-1)!;
    for (const [a, b] of BOARD_BLOCKS) expect(a >= Math.max(from, STRAND_END) && b <= to).toBe(true);
  });

  it('has strands that run from Nursery without gaps: the Quran to Class 5 (hifz), the others to Class 8', () => {
    for (const { strand, segments } of STRANDS) {
      expect(segments[0].from).toBe(0);
      segments.slice(1).forEach((s, i) => expect(s.from).toBe(segments[i].to));
      expect(segments.at(-1)!.to).toBe(strand === 'quran' ? 7 : STRAND_END);
    }
  });

  it('has splits that add up to 100', () => {
    for (const { split } of STAGE_SPLITS) expect(split.reduce((a, b) => a + b)).toBe(100);
  });
});

describe('splitAtStages', () => {
  it('keeps a segment inside one stage whole', () => {
    expect(splitAtStages(3, 4)).toEqual([[3, 4]]);
  });

  it('cuts a segment where stages meet', () => {
    expect(splitAtStages(0, 10)).toEqual([[0, 3], [3, 7], [7, 10]]);
    expect(splitAtStages(0, 6)).toEqual([[0, 3], [3, 6]]);
  });
});

describe('tileGeometry', () => {
  it('lays three tiles out with two gaps', () => {
    expect(tileGeometry([25, 25, 50], 6)).toEqual([
      { start: 0, size: 0.25, offset: 0, gaps: 12 },
      { start: 0.25, size: 0.25, offset: 6, gaps: 12 },
      { start: 0.5, size: 0.5, offset: 12, gaps: 12 },
    ]);
  });

  it('gives an empty slot no width and no gap', () => {
    expect(tileGeometry([0, 50, 50], 6)).toEqual([
      { start: 0, size: 0, offset: 0, gaps: 6 },
      { start: 0, size: 0.5, offset: 0, gaps: 6 },
      { start: 0.5, size: 0.5, offset: 6, gaps: 6 },
    ]);
  });
});
