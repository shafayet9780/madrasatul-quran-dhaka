import { getSiteUrl } from './site-url';
import { SOCIAL_IMAGE } from './page-metadata';

// The school's pin on Google Maps (School details → Location → Google Maps Link).
const SCHOOL_GEO = { '@type': 'GeoCoordinates', latitude: 23.8563215, longitude: 90.3682335 } as const;

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Office hours written like "Sat - Thu: 8:00 AM - 5:00 PM" (School details, English) as schema.org opening hours;
 * undefined for anything else, so a differently written text is left out rather than misread.
 */
export function openingHoursFrom(text?: string) {
  const m = text?.trim().match(/^(\w{3})\w*\s*[-–]\s*(\w{3})\w*\s*:\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
  if (!m) return undefined;
  const day = (d: string) => DAYS.findIndex((name) => name.slice(0, 3).toLowerCase() === d.toLowerCase());
  const [from, to] = [day(m[1]), day(m[2])];
  if (from < 0 || to < 0 || [m[3], m[6]].some((h) => Number(h) < 1 || Number(h) > 12) || [m[4], m[7]].some((min) => Number(min ?? 0) > 59)) return undefined;
  const time = (h: string, min: string | undefined, half: string) =>
    `${String((Number(h) % 12) + (half.toUpperCase() === 'PM' ? 12 : 0)).padStart(2, '0')}:${min ?? '00'}`;
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: Array.from({ length: ((to - from + 7) % 7) + 1 }, (_, i) => DAYS[(from + i) % 7]),
    opens: time(m[3], m[4], m[5]),
    closes: time(m[6], m[7], m[8]),
  };
}

/**
 * The school for search engines (schema.org School): from School details the name, logo, address, office hours, the
 * admissions phone, the active emails, the map and the social pages (anything missing is left out), with the share
 * picture (Studio → Search & sharing, else the photo of the school's front) and its place on the map.
 */
export function generateSchoolStructuredData({
  locale,
  logo,
  address,
  hours,
  telephone,
  emails,
  mapUrl,
  sameAs,
  image,
}: {
  locale: 'bengali' | 'english';
  logo?: string;
  address?: string;
  /** Office hours, English (openingHoursFrom). */
  hours?: string;
  telephone?: string;
  emails: string[];
  mapUrl?: string;
  sameAs: string[];
  /** The share picture's URL. */
  image?: string;
}) {
  const origin = getSiteUrl();
  const openingHours = openingHoursFrom(hours);
  const [name, alternateName] = locale === 'bengali' ? ['মাদরাসাতুল কুরআন', 'Madrasatul Quran'] : ['Madrasatul Quran', 'মাদরাসাতুল কুরআন'];
  return {
    '@context': 'https://schema.org',
    '@type': 'School',
    '@id': `${origin}/#school`,
    name,
    alternateName,
    url: `${origin}/${locale}`,
    image: image ?? `${origin}${SOCIAL_IMAGE}`,
    ...(logo && { logo }),
    ...(address && { address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Dhaka', addressCountry: 'BD' } }),
    geo: SCHOOL_GEO,
    ...(openingHours && { openingHoursSpecification: openingHours }),
    ...(telephone && { telephone }),
    ...(emails.length > 0 && { email: emails.length === 1 ? emails[0] : emails }),
    ...(mapUrl && { hasMap: mapUrl }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  locale: 'bengali' | 'english'
) {
  const baseUrl = getSiteUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`,
    })),
  };
}

/**
 * Serialize a structured-data object for safe inline injection.
 * Escapes `<` so a value containing `</script>` cannot break out of the tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Generate Person structured data for a director or teacher profile.
 */
export function generatePersonStructuredData(
  person: {
    name: string;
    jobTitle?: string;
    description?: string;
    imageUrl?: string;
    url: string;
  },
  locale: 'bengali' | 'english'
) {
  const baseUrl = getSiteUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    description: person.description,
    image: person.imageUrl,
    url: `${baseUrl}${person.url}`,
    worksFor: {
      '@type': 'EducationalOrganization',
      '@id': `${baseUrl}/#organization`,
      name: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
    },
  };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>,
  locale: 'bengali' | 'english'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
