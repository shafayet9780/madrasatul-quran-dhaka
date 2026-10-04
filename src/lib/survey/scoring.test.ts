import { describe, expect, it } from 'vitest';
import { score, spacedMarks } from './scoring';

describe('score', () => {
  it('maps the 4–10 scale to 0–100', () => {
    expect(score(10)).toBe(100);
    expect(score(4)).toBe(0);
    expect(score(7)).toBe(50);
    expect(score(8)).toBeCloseTo(66.67, 2);
  });
});

describe('spacedMarks', () => {
  it('spaces hidden option marks from 10 to 4', () => {
    expect(spacedMarks(4)).toEqual([10, 8, 6, 4]);
    expect(spacedMarks(3)).toEqual([10, 7, 4]);
    expect(spacedMarks(5)).toEqual([10, 8.5, 7, 5.5, 4]);
  });
  it('rejects fewer than two options', () => {
    expect(() => spacedMarks(1)).toThrow();
  });
});
