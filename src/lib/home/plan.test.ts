import { describe, expect, it } from 'vitest';
import { tileGeometry } from './plan';

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
