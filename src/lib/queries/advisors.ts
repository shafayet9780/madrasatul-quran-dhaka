import { sanityFetch } from '@/lib/sanity-fetch';
import type { Advisor } from '@/types/sanity';

const advisorProjection = `
  _id,
  _type,
  name,
  gender,
  photo { ..., alt },
  summary,
  displayOrder,
  featured
`;

export async function getAdvisors(): Promise<Advisor[]> {
  const query = `
    *[_type == "advisor"] | order(displayOrder asc) {
      ${advisorProjection}
    }
  `;
  // The local preview reads no Sanity (null): an empty list there.
  return (await sanityFetch<Advisor[] | null>({ query, tags: ['advisor'] })) ?? [];
}
