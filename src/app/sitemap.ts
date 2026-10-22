import { getSiteUrl } from '@/lib/site-url';
import { MetadataRoute } from 'next';
import { getDirectorSlugs } from '@/lib/queries/directors';
import { getTeacherSlugs } from '@/lib/queries/teachers';
import { getNavigationVisibility } from '@/lib/queries/site';
import { getContentService } from '@/lib/content-service';
import { toAlbum } from '@/lib/gallery/albums';
import { dhakaToday, toNotice } from '@/lib/notices/notices';
import {
  isSectionVisible,
  type NavigationVisibility,
} from '@/lib/nav-visibility';

function bilingual(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const alternates = {
    languages: {
      'bn-BD': `${baseUrl}/bengali${path}`,
      en: `${baseUrl}/english${path}`,
      'x-default': `${baseUrl}/bengali${path}`,
    },
  };
  return [
    { url: `${baseUrl}/bengali${path}`, changeFrequency, priority, alternates },
    { url: `${baseUrl}/english${path}`, changeFrequency, priority, alternates },
  ];
}

/** A detail page whose slug differs per locale — alternates point to the matching locale slug. */
function bilingualSlug(
  base: string,
  bengaliSlug: string | undefined,
  englishSlug: string | undefined,
  priority: number
): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const languages: Record<string, string> = {};
  if (bengaliSlug)
    languages['bn-BD'] = `${baseUrl}/bengali${base}/${bengaliSlug}`;
  if (englishSlug) languages['en'] = `${baseUrl}/english${base}/${englishSlug}`;
  const entries: MetadataRoute.Sitemap = [];
  if (bengaliSlug)
    entries.push({
      url: `${baseUrl}/bengali${base}/${bengaliSlug}`,
      changeFrequency: 'monthly',
      priority,
      alternates: { languages },
    });
  if (englishSlug)
    entries.push({
      url: `${baseUrl}/english${base}/${englishSlug}`,
      changeFrequency: 'monthly',
      priority,
      alternates: { languages },
    });
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
  const showCampus = isSectionVisible('campus', visibility);
  const showGallery = isSectionVisible('gallery', visibility);
  const showNotices = isSectionVisible('notices', visibility);
  // About us holds the board and the advisors (the old /directors and /advisors redirect there).
  const showAbout = isSectionVisible('people', visibility) && (showDirectors || showAdvisors);

  const staticPages: MetadataRoute.Sitemap = [
    ...bilingual('', 1.0, 'weekly'),
    ...bilingual('/contact', 0.8, 'monthly'),
    ...bilingual('/curriculum', 0.9, 'monthly'),
    ...bilingual('/admissions', 0.9, 'monthly'),
    ...bilingual('/pre-admission', 0.8, 'monthly'),
    ...(showAbout ? bilingual('/about', 0.8, 'monthly') : []),
    ...(showCampus ? bilingual('/campus', 0.8, 'monthly') : []),
    ...(showGallery ? bilingual('/gallery', 0.7, 'weekly') : []),
    ...(showNotices ? bilingual('/notices', 0.8, 'daily') : []),
    ...(showTeachers ? bilingual('/teachers', 0.8, 'monthly') : []),
  ];

  let profilePages: MetadataRoute.Sitemap = [];
  try {
    const [directorSlugs, teacherSlugs, albums, notices] = await Promise.all([
      getDirectorSlugs(),
      getTeacherSlugs(),
      showGallery ? getContentService(false).getAlbums() : [],
      showNotices ? getContentService(false).getNotices() : [],
    ]);
    // Every notice page there is: one in Bengali only shows in Bengali on the English page too.
    const today = dhakaToday();
    const noticeSlugs = notices.flatMap(n => toNotice(n, 'bengali', today)?.slug ?? []);
    // An album is listed in each language it can be shown in.
    const shown = (a: (typeof albums)[number], locale: 'bengali' | 'english') =>
      toAlbum(a, locale, p => p.asset?._ref) ? a.slug : undefined;
    profilePages = [
      ...(showDirectors
        ? directorSlugs.flatMap(s =>
            bilingualSlug('/directors', s.bengali, s.english, 0.6)
          )
        : []),
      ...(showTeachers
        ? teacherSlugs.flatMap(s =>
            bilingualSlug('/teachers', s.bengali, s.english, 0.6)
          )
        : []),
      ...albums.flatMap(a =>
        bilingualSlug('/gallery', shown(a, 'bengali'), shown(a, 'english'), 0.5)
      ),
      ...noticeSlugs.flatMap(s => bilingualSlug('/notices', s, s, 0.5)),
    ];
  } catch (error) {
    console.error('Error building dynamic sitemap entries:', error);
  }

  return [...staticPages, ...profilePages];
}
