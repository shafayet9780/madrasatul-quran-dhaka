import { describe, it, expect } from 'vitest';
import { rankOf, sortBySeniority, seniorityBadgeKey } from './seniority';

describe('rankOf', () => {
  it('orders known roles from most to least senior', () => {
    expect(rankOf('chairman')).toBeLessThan(rankOf('principal'));
    expect(rankOf('principal')).toBeLessThan(rankOf('vice_principal'));
    expect(rankOf('head_of_department')).toBeLessThan(rankOf('senior_teacher'));
    expect(rankOf('senior_teacher')).toBeLessThan(rankOf('teacher'));
  });

  it('ranks unknown/undefined after all named roles', () => {
    expect(rankOf(undefined)).toBeGreaterThan(rankOf('assistant_teacher'));
    expect(rankOf('nonsense')).toBeGreaterThan(rankOf('assistant_teacher'));
  });
});

describe('sortBySeniority', () => {
  it('sorts by seniority rank, then displayOrder, without mutating input', () => {
    const input = [
      { _id: 'a', seniority: 'teacher', displayOrder: 1 },
      { _id: 'b', seniority: 'principal', displayOrder: 9 },
      { _id: 'c', displayOrder: 0 }, // no seniority
      { _id: 'd', seniority: 'teacher', displayOrder: 0 },
    ];
    const out = sortBySeniority(input);
    expect(out.map((x) => x._id)).toEqual(['b', 'd', 'a', 'c']);
    // input not mutated
    expect(input[0]._id).toBe('a');
  });
});

describe('seniorityBadgeKey', () => {
  it('returns a message key for senior roles', () => {
    expect(seniorityBadgeKey('principal')).toBe('seniority.principal');
    expect(seniorityBadgeKey('head_of_department')).toBe('seniority.head_of_department');
  });

  it('returns null for the baseline teacher role and empty values', () => {
    expect(seniorityBadgeKey('teacher')).toBeNull();
    expect(seniorityBadgeKey(undefined)).toBeNull();
    expect(seniorityBadgeKey('')).toBeNull();
  });
});
