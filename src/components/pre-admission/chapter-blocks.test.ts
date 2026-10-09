import { describe, expect, it } from 'vitest';
import { blocks } from './chapter-form';
import { sampleSnapshot } from '@/lib/admissions/testing/fixtures';

describe('chapter blocks', () => {
  it('puts a field without a group into the group of the field before it', () => {
    const student = structuredClone(sampleSnapshot().sections[0]);
    // A question added in the Studio after the names, with no group.
    const added = { ...student.fields[1], key: 'gender', role: undefined, group: undefined };
    student.fields.splice(2, 0, added);
    const result = blocks(student);
    expect(result.every((b) => b.group)).toBe(true);
    expect(result[0].fields.map((f) => f.key)).toContain('gender');
    expect(result.flatMap((b) => b.fields)).toHaveLength(student.fields.length);
  });

  it('keeps a chapter without groups as one block', () => {
    const father = sampleSnapshot().sections[1];
    expect(blocks(father)).toEqual([{ fields: father.fields }]);
  });
});
