import { sanityFetch } from '@/lib/sanity-fetch';
import type { AvatarPlaceholders } from '@/lib/profile-avatar';
import type { MultilingualText, MultilingualSlug, SanityImage } from '@/types/sanity';

export interface PeopleNavDirector {
  _id: string;
  name: MultilingualText;
  slug: MultilingualSlug;
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
  departments: PeopleNavDepartment[];
}

/** Compact data for the "Our People" navigation mega-menu. */
export async function getPeopleNav(): Promise<PeopleNavData> {
  const query = `{
    "directors": *[_type == "director"] | order(featured desc, displayOrder asc)[0...4] {
      _id, name, slug, gender, photo { ..., alt }
    },
    "departments": *[_type == "department"] | order(displayOrder asc) {
      _id, name, slug
    }
  }`;
  const result = await sanityFetch<PeopleNavData | null>({ query, tags: ['director', 'department'] });
  return { directors: result?.directors ?? [], departments: result?.departments ?? [] };
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
