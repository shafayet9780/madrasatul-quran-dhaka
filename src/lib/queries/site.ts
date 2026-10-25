import { sanityFetch } from '@/lib/sanity-fetch';
import { pagesOnOffProjection } from '@/lib/sanity-queries';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { NavigationVisibility } from '@/lib/nav-visibility';
import type { SanityImage } from '@/types/sanity';

/** Studio → Menu and pages. */
export async function getNavigationVisibility(): Promise<NavigationVisibility> {
  // The old switches stand in until the clean-up script has made Menu and pages (docs/studio-cleanup.md).
  const query = `coalesce(${pagesOnOffProjection}, *[_type == "siteSettings"][0].navigationVisibility)`;
  const result = await sanityFetch<NavigationVisibility | null>({ query, tags: ['pagesOnOff'] });
  return result ?? {};
}

/** Lightweight read of just the gender placeholder avatars from School details. */
export async function getProfilePlaceholders(): Promise<AvatarPlaceholders> {
  const query = `
    *[_type == "siteSettings"][0] {
      "male": defaultMaleAvatar { ..., "alt": coalesce(alt, "Avatar") },
      "female": defaultFemaleAvatar { ..., "alt": coalesce(alt, "Avatar") }
    }
  `;
  const result = await sanityFetch<{ male?: SanityImage; female?: SanityImage } | null>({
    query,
    tags: ['siteSettings'],
  });
  return { male: result?.male ?? null, female: result?.female ?? null };
}

export interface PeoplePageData {
  placeholders: AvatarPlaceholders;
  visibility: NavigationVisibility;
}

/**
 * Single School details read for the directors/teachers/advisors routes —
 * returns the avatar placeholders + nav visibility together so each route
 * makes one round-trip instead of two.
 */
export async function getPeoplePageData(): Promise<PeoplePageData> {
  const query = `
    *[_type == "siteSettings"][0] {
      "male": defaultMaleAvatar { ..., "alt": coalesce(alt, "Avatar") },
      "female": defaultFemaleAvatar { ..., "alt": coalesce(alt, "Avatar") },
      "navigationVisibility": coalesce(${pagesOnOffProjection}, navigationVisibility)
    }
  `;
  const result = await sanityFetch<{
    male?: SanityImage;
    female?: SanityImage;
    navigationVisibility?: NavigationVisibility;
  } | null>({ query, tags: ['siteSettings', 'pagesOnOff'] });
  return {
    placeholders: { male: result?.male ?? null, female: result?.female ?? null },
    visibility: result?.navigationVisibility ?? {},
  };
}
