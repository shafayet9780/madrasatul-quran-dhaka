import type { SanityImage } from '@/types/sanity';

export interface AvatarPlaceholders {
  male?: SanityImage | null;
  female?: SanityImage | null;
}

/**
 * Pick the image to show for a profile.
 * - Own photo wins.
 * - Otherwise fall back to the gender-specific shared placeholder
 *   (female staff typically have no photo per modesty guidelines).
 * - Returns null when nothing is available so the UI can render a generic icon.
 */
export function resolveProfileImage(
  photo: SanityImage | undefined | null,
  gender: 'male' | 'female',
  placeholders?: AvatarPlaceholders
): SanityImage | null {
  if (photo) return photo;
  if (gender === 'female') return placeholders?.female ?? null;
  return placeholders?.male ?? null;
}
