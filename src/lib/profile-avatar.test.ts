import { describe, it, expect } from 'vitest';
import { resolveProfileImage } from './profile-avatar';
import type { SanityImage } from '@/types/sanity';

const img = (ref: string): SanityImage => ({
  _type: 'image',
  asset: { _ref: ref, _type: 'reference' },
  alt: ref,
});

const placeholders = { male: img('male-ph'), female: img('female-ph') };

describe('resolveProfileImage', () => {
  it('returns the profile photo when present, regardless of gender', () => {
    const photo = img('photo');
    expect(resolveProfileImage(photo, 'female', placeholders)).toBe(photo);
    expect(resolveProfileImage(photo, 'male', placeholders)).toBe(photo);
  });

  it('returns the female placeholder for a female with no photo', () => {
    expect(resolveProfileImage(undefined, 'female', placeholders)).toBe(placeholders.female);
  });

  it('returns the male placeholder for a male with no photo', () => {
    expect(resolveProfileImage(null, 'male', placeholders)).toBe(placeholders.male);
  });

  it('returns null when no photo and no matching placeholder', () => {
    expect(resolveProfileImage(undefined, 'female', {})).toBeNull();
    expect(resolveProfileImage(undefined, 'male', undefined)).toBeNull();
  });
});
