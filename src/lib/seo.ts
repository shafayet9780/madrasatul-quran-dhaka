import { getSiteUrl } from './site-url';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export interface SEOData {
  title: {
    bengali: string;
    english: string;
  };
  description: {
    bengali: string;
    english: string;
  };
  keywords?: {
    bengali: string[];
    english: string[];
  };
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

/**
 * Generate metadata for Next.js pages
 */
export async function generateMetadata(
  seoData: SEOData,
  locale: 'bengali' | 'english',
  path: string = ''
): Promise<Metadata> {
  const t = await getTranslations('seo');
  const baseUrl = getSiteUrl();
  const currentUrl = `${baseUrl}/${locale}${path}`;

  const title = seoData.title[locale];
  const description = seoData.description[locale];
  const keywords = seoData.keywords?.[locale] || [];

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: seoData.author ? [{ name: seoData.author }] : undefined,
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
      locale: locale === 'bengali' ? 'bn_BD' : 'en_US',
      type: seoData.type || 'website',
      publishedTime: seoData.publishedTime,
      modifiedTime: seoData.modifiedTime,
      section: seoData.section,
      images: seoData.image ? [
        {
          url: seoData.image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ] : undefined,
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seoData.image ? [seoData.image] : undefined,
      creator: '@madrasatul_quran',
      site: '@madrasatul_quran',
    },

    // Additional meta tags
    other: {
      'og:locale:alternate': locale === 'bengali' ? 'en_US' : 'bn_BD',
      'article:author': seoData.author || '',
      'article:section': seoData.section || '',
      'article:published_time': seoData.publishedTime || '',
      'article:modified_time': seoData.modifiedTime || '',
    },

    // Canonical URL
    alternates: {
      canonical: currentUrl,
      languages: {
        'bn-BD': `${baseUrl}/bengali${path}`,
        'en-US': `${baseUrl}/english${path}`,
      },
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * The school for search engines (schema.org School), built only from Site Settings: the name, logo, address, the
 * admissions phone, the active emails, the map and the social pages. Anything missing is left out.
 */
export function generateSchoolStructuredData({
  locale,
  logo,
  address,
  telephone,
  emails,
  mapUrl,
  sameAs,
}: {
  locale: 'bengali' | 'english';
  logo?: string;
  address?: string;
  telephone?: string;
  emails: string[];
  mapUrl?: string;
  sameAs: string[];
}) {
  const origin = getSiteUrl();
  const [name, alternateName] = locale === 'bengali' ? ['মাদরাসাতুল কুরআন', 'Madrasatul Quran'] : ['Madrasatul Quran', 'মাদরাসাতুল কুরআন'];
  return {
    '@context': 'https://schema.org',
    '@type': 'School',
    '@id': `${origin}/#school`,
    name,
    alternateName,
    url: `${origin}/${locale}`,
    ...(logo && { logo, image: logo }),
    ...(address && { address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Dhaka', addressCountry: 'BD' } }),
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

/**
 * Default SEO configuration for different page types
 */
export const defaultSEOConfig = {
  homepage: {
    title: {
      bengali: 'মাদরাসাতুল কুরআন - ইসলামী শিক্ষায় উৎকর্ষতা',
      english: 'Madrasatul Quran - Excellence in Islamic Education',
    },
    description: {
      bengali: 'ঢাকার একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান যা ঐতিহ্যবাহী ইসলামী শিক্ষার সাথে আধুনিক শিক্ষার সমন্বয় করে সামগ্রিক উন্নয়নের জন্য।',
      english: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development.',
    },
    keywords: {
      bengali: ['ইসলামী শিক্ষা', 'মাদরাসা', 'কুরআন', 'হাদিস', 'ঢাকা', 'বাংলাদেশ', 'শিক্ষা প্রতিষ্ঠান'],
      english: ['Islamic education', 'Madrasah', 'Quran', 'Hadith', 'Dhaka', 'Bangladesh', 'Educational institution'],
    },
  },
  
  about: {
    title: {
      bengali: 'আমাদের সম্পর্কে - মাদরাসাতুল কুরআন',
      english: 'About Us - Madrasatul Quran',
    },
    description: {
      bengali: 'মাদরাসাতুল কুরআনের ইতিহাস, দর্শন এবং নেতৃত্ব সম্পর্কে জানুন। আমাদের শিক্ষা পদ্ধতি এবং মূল্যবোধ সম্পর্কে বিস্তারিত তথ্য।',
      english: 'Learn about Madrasatul Quran\'s history, philosophy, and leadership. Detailed information about our educational approach and values.',
    },
  },
  
  programs: {
    title: {
      bengali: 'শিক্ষা কার্যক্রম - মাদরাসাতুল কুরআন',
      english: 'Academic Programs - Madrasatul Quran',
    },
    description: {
      bengali: 'আমাদের ইসলামী শিক্ষা এবং এনসিটিবি পাঠ্যক্রমের বিস্তারিত তথ্য। কুরআন মুখস্থকরণ, হাদিস, ফিকহ এবং আধুনিক বিষয়সমূহ।',
      english: 'Comprehensive information about our Islamic studies and NCTB curriculum. Quran memorization, Hadith, Fiqh, and modern subjects.',
    },
  },
  
  admissions: {
    title: {
      bengali: 'ভর্তি তথ্য - মাদরাসাতুল কুরআন',
      english: 'Admissions - Madrasatul Quran',
    },
    description: {
      bengali: 'ভর্তির প্রয়োজনীয়তা, আবেদন প্রক্রিয়া, ফি কাঠামো এবং গুরুত্বপূর্ণ তারিখসমূহ। বৃত্তি এবং আর্থিক সহায়তার তথ্য।',
      english: 'Admission requirements, application process, fee structure, and important dates. Scholarship and financial aid information.',
    },
  },
  
  contact: {
    title: {
      bengali: 'যোগাযোগ - মাদরাসাতুল কুরআন',
      english: 'Contact Us - Madrasatul Quran',
    },
    description: {
      bengali: 'মাদরাসাতুল কুরআনের সাথে যোগাযোগের তথ্য। ঠিকানা, ফোন নম্বর, ইমেইল এবং অবস্থানের মানচিত্র।',
      english: 'Contact information for Madrasatul Quran. Address, phone numbers, email, and location map.',
    },
  },
} as const;