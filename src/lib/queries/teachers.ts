import { sanityFetch } from '@/lib/sanity-fetch';
import { Teacher } from '@/types/sanity';

const departmentProjection = `
  department->{
    _id,
    name,
    slug,
    accentColor,
    displayOrder
  }
`;

const teacherListProjection = `
  _id,
  _type,
  name,
  slug,
  designation,
  seniority,
  gender,
  photo { ..., alt },
  subjects,
  specializations,
  yearsOfExperience,
  displayOrder,
  featured,
  ${departmentProjection}
`;

const teacherDetailProjection = `
  _id,
  _type,
  name,
  slug,
  designation,
  seniority,
  gender,
  photo { ..., alt },
  summary,
  fullBio,
  subjects,
  qualifications,
  specializations,
  yearsOfExperience,
  education[] {
    degree,
    institution,
    year
  },
  displayOrder,
  featured,
  ${departmentProjection}
`;

export async function getTeachers(): Promise<Teacher[]> {
  const query = `
    *[_type == "teacher"] | order(department->displayOrder asc, displayOrder asc) {
      ${teacherListProjection}
    }
  `;
  return await sanityFetch<Teacher[]>({ query, tags: ['teacher', 'department'] });
}

export async function getTeacherBySlug(
  slug: string,
  language: 'bengali' | 'english'
): Promise<Teacher | null> {
  const query = `
    *[_type == "teacher" && slug.${language}.current == $slug][0] {
      ${teacherDetailProjection}
    }
  `;
  return await sanityFetch<Teacher | null>({ query, params: { slug }, tags: ['teacher', 'department'] });
}

/** All slugs in both locales for generateStaticParams / sitemap. */
export async function getTeacherSlugs(): Promise<
  Array<{ bengali?: string; english?: string }>
> {
  const query = `
    *[_type == "teacher" && defined(slug.english.current)] {
      "bengali": slug.bengali.current,
      "english": slug.english.current
    }
  `;
  return await sanityFetch({ query, tags: ['teacher'] });
}
