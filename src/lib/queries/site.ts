import { sanityFetch } from '@/lib/sanity-fetch';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { NavigationVisibility } from '@/lib/nav-visibility';
import type { MultilingualText, MultilingualSlug, SanityImage } from '@/types/sanity';

export interface PeopleNavDirector {
  _id: string;
  name: MultilingualText;
  slug: MultilingualSlug;
  gender: 'male' | 'female';
  photo?: SanityImage;
  showDetailPage?: boolean;
}

export interface PeopleNavAdvisor {
  _id: string;
  name: MultilingualText;
  gender: 'male' | 'female';
  photo?: SanityImage;
}

export interface PeopleNavDepartment {
  _id: string;
  name: MultilingualText;
  slug: MultilingualSlug;
}

export interface PeopleNavData {
  directors: PeopleNavDirector[];
  advisors: PeopleNavAdvisor[];
  departments: PeopleNavDepartment[];
}

/** Compact data for the "Our People" navigation mega-menu. */
export async function getPeopleNav(): Promise<PeopleNavData> {
  const query = `{
    "directors": *[_type == "director" && featured == true] | order(displayOrder asc)[0...6] {
      _id, name, slug, gender, photo { ..., alt }, showDetailPage
    },
    "advisors": *[_type == "advisor" && featured == true] | order(displayOrder asc)[0...6] {
      _id, name, gender, photo { ..., alt }
    },
    "departments": *[_type == "department"] | order(displayOrder asc) {
      _id, name, slug
    }
  }`;
  const result = await sanityFetch<PeopleNavData | null>({
    query,
    tags: ['director', 'advisor', 'department'],
  });
  return {
    directors: result?.directors ?? [],
    advisors: result?.advisors ?? [],
    departments: result?.departments ?? [],
  };
}

/** Editor-controlled show/hide toggles for the "Our People" nav sections. */
export async function getNavigationVisibility(): Promise<NavigationVisibility> {
  const query = `*[_type == "siteSettings"][0].navigationVisibility`;
  const result = await sanityFetch<NavigationVisibility | null>({ query, tags: ['siteSettings'] });
  return result ?? {};
}

/** Lightweight read of just the gender placeholder avatars from Site Settings. */
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
 * Single Site Settings read for the directors/teachers/advisors routes —
 * returns the avatar placeholders + nav visibility together so each route
 * makes one round-trip instead of two.
 */
export async function getPeoplePageData(): Promise<PeoplePageData> {
  const query = `
    *[_type == "siteSettings"][0] {
      "male": defaultMaleAvatar { ..., "alt": coalesce(alt, "Avatar") },
      "female": defaultFemaleAvatar { ..., "alt": coalesce(alt, "Avatar") },
      navigationVisibility
    }
  `;
  const result = await sanityFetch<{
    male?: SanityImage;
    female?: SanityImage;
    navigationVisibility?: NavigationVisibility;
  } | null>({ query, tags: ['siteSettings'] });
  return {
    placeholders: { male: result?.male ?? null, female: result?.female ?? null },
    visibility: result?.navigationVisibility ?? {},
  };
}
