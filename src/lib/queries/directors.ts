import { sanityFetch } from '@/lib/sanity-fetch';
import { Director } from '@/types/sanity';

const directorListProjection = `
  _id,
  _type,
  name,
  slug,
  designation,
  gender,
  photo { ..., alt },
  summary,
  displayOrder,
  featured
`;

const directorDetailProjection = `
  _id,
  _type,
  name,
  slug,
  designation,
  gender,
  photo { ..., alt },
  summary,
  message,
  fullBio,
  qualifications,
  education[] {
    degree,
    institution,
    year
  },
  socialLinks[] { platform, url },
  signatureName,
  displayOrder,
  featured
`;

export async function getDirectors(): Promise<Director[]> {
  const query = `
    *[_type == "director"] | order(displayOrder asc) {
      ${directorListProjection}
    }
  `;
  return await sanityFetch<Director[]>({ query, tags: ['director'] });
}

export async function getDirectorBySlug(
  slug: string,
  language: 'bengali' | 'english'
): Promise<Director | null> {
  const query = `
    *[_type == "director" && slug.${language}.current == $slug][0] {
      ${directorDetailProjection}
    }
  `;
  return await sanityFetch<Director | null>({ query, params: { slug }, tags: ['director'] });
}

/** All slugs in both locales for generateStaticParams / sitemap. */
export async function getDirectorSlugs(): Promise<
  Array<{ bengali?: string; english?: string }>
> {
  const query = `
    *[_type == "director" && defined(slug.english.current)] {
      "bengali": slug.bengali.current,
      "english": slug.english.current
    }
  `;
  return await sanityFetch({ query, tags: ['director'] });
}
