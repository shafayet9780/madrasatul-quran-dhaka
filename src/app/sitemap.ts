import { MetadataRoute } from 'next';
import { getDirectorSlugs } from '@/lib/queries/directors';
import { getTeacherSlugs } from '@/lib/queries/teachers';
import { getNavigationVisibility } from '@/lib/queries/site';
import { isSectionVisible, type NavigationVisibility } from '@/lib/nav-visibility';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';

function bilingual(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      'bn-BD': `${baseUrl}/bengali${path}`,
      'en-US': `${baseUrl}/english${path}`,
    },
  };
  return [
    { url: `${baseUrl}/bengali${path}`, lastModified: new Date(), changeFrequency, priority, alternates },
    { url: `${baseUrl}/english${path}`, lastModified: new Date(), changeFrequency, priority, alternates },
  ];
}

/** A detail page whose slug differs per locale — alternates point to the matching locale slug. */
function bilingualSlug(
  base: string,
  bengaliSlug: string | undefined,
  englishSlug: string | undefined,
  priority: number
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  if (bengaliSlug) languages['bn-BD'] = `${baseUrl}/bengali${base}/${bengaliSlug}`;
  if (englishSlug) languages['en-US'] = `${baseUrl}/english${base}/${englishSlug}`;
  const entries: MetadataRoute.Sitemap = [];
  if (bengaliSlug)
    entries.push({ url: `${baseUrl}/bengali${base}/${bengaliSlug}`, lastModified: new Date(), changeFrequency: 'monthly', priority, alternates: { languages } });
  if (englishSlug)
    entries.push({ url: `${baseUrl}/english${base}/${englishSlug}`, lastModified: new Date(), changeFrequency: 'monthly', priority, alternates: { languages } });
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fail-open: if visibility can't be read, treat all sections as visible.
  let visibility: NavigationVisibility = {};
  try {
    visibility = await getNavigationVisibility();
  } catch (error) {
    console.error('Error reading navigation visibility for sitemap:', error);
  }
  const showDirectors = isSectionVisible('directors', visibility);
  const showTeachers = isSectionVisible('teachers', visibility);
  const showAdvisors = isSectionVisible('advisors', visibility);

  const staticPages: MetadataRoute.Sitemap = [
    ...bilingual('', 1.0, 'weekly'),
    ...bilingual('/contact', 0.8, 'monthly'),
    ...bilingual('/curriculum', 0.9, 'monthly'),
    ...bilingual('/pre-admission', 0.8, 'monthly'),
    ...(showDirectors ? bilingual('/directors', 0.8, 'monthly') : []),
    ...(showAdvisors ? bilingual('/advisors', 0.7, 'monthly') : []),
    ...(showTeachers ? bilingual('/teachers', 0.8, 'monthly') : []),
  ];

  let profilePages: MetadataRoute.Sitemap = [];
  try {
    const [directorSlugs, teacherSlugs] = await Promise.all([getDirectorSlugs(), getTeacherSlugs()]);
    profilePages = [
      ...(showDirectors
        ? directorSlugs.flatMap((s) => bilingualSlug('/directors', s.bengali, s.english, 0.6))
        : []),
      ...(showTeachers
        ? teacherSlugs.flatMap((s) => bilingualSlug('/teachers', s.bengali, s.english, 0.6))
        : []),
    ];
  } catch (error) {
    console.error('Error building dynamic sitemap entries:', error);
  }

  return [...staticPages, ...profilePages];
}
