import { describe, expect, it } from 'vitest';
import type { Director } from '@/types/sanity';
import { profileHref, splitBoard } from './people';

const photo = { asset: { _ref: 'image-a' } } as Director['photo'];
const slug = { bengali: { current: 's-m-nahid-hasan' }, english: { current: 's-m-nahid-hasan' } };

describe('profileHref', () => {
  it('links a director with a profile page in the page language', () => {
    expect(profileHref({ slug, showDetailPage: true }, 'bengali')).toBe('/bengali/directors/s-m-nahid-hasan');
    expect(profileHref({ slug }, 'english')).toBe('/english/directors/s-m-nahid-hasan');
  });
  it('gives no link without a page or a slug', () => {
    expect(profileHref({ slug, showDetailPage: false }, 'bengali')).toBeUndefined();
    expect(profileHref({ slug: undefined as unknown as Director['slug'] }, 'bengali')).toBeUndefined();
  });
});

describe('splitBoard', () => {
  it('puts the first director alone at the top, then portraits, then names', () => {
    const board = splitBoard([
      { id: 'chair', photo },
      { id: 'vice', photo },
      { id: 'member' },
      { id: 'md', photo },
    ] as (Pick<Director, 'photo'> & { id: string })[]);
    expect(board.chairman?.id).toBe('chair');
    expect(board.leaders.map((d) => d.id)).toEqual(['vice', 'md']);
    expect(board.members.map((d) => d.id)).toEqual(['member']);
  });
  it('handles an empty board', () => {
    expect(splitBoard([])).toEqual({ chairman: null, leaders: [], members: [] });
  });
});
