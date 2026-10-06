import { describe, expect, it } from 'vitest';
import { spacedMarks } from './scoring';

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
