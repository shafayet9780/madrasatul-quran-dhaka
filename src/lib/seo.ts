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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
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
      'article:author': seoData.author,
      'article:section': seoData.section,
      'article:published_time': seoData.publishedTime,
      'article:modified_time': seoData.modifiedTime,
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
 * Generate structured data for educational institution
 */
export function generateEducationalInstitutionStructuredData(locale: 'bengali' | 'english') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${baseUrl}/#organization`,
    name: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
    alternateName: locale === 'bengali' ? 'Madrasatul Quran' : 'মাদরাসাতুল কুরআন',
    description: locale === 'bengali' 
      ? 'ঢাকার একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান যা ঐতিহ্যবাহী ইসলামী শিক্ষার সাথে আধুনিক শিক্ষার সমন্বয় করে।'
      : 'A leading Islamic educational institution in Dhaka combining traditional Islamic education with modern curriculum.',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    image: `${baseUrl}/images/campus-main.jpg`,
    
    // Contact Information
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'House 123, Road 456',
      addressLocality: 'Dhaka',
      addressRegion: 'Dhaka Division',
      postalCode: '1000',
      addressCountry: 'BD',
    },
    
    telephone: '+880-2-1234567',
    email: 'info@madrasatul-quran.edu.bd',
    
    // Educational Details
    foundingDate: '1995',
    numberOfStudents: 500,
    
    // Programs Offered
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: locale === 'bengali' ? 'শিক্ষা কার্যক্রম' : 'Educational Programs',
      itemListElement: [
        {
          '@type': 'Course',
          name: locale === 'bengali' ? 'কুরআন মুখস্থকরণ' : 'Quran Memorization',
          description: locale === 'bengali' 
            ? 'সম্পূর্ণ কুরআন মুখস্থকরণের জন্য বিশেষ কার্যক্রম'
            : 'Specialized program for complete Quran memorization',
        },
        {
          '@type': 'Course',
          name: locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Studies',
          description: locale === 'bengali'
            ? 'হাদিস, ফিকহ, আরবি ভাষা এবং ইসলামী ইতিহাস'
            : 'Hadith, Fiqh, Arabic language, and Islamic history',
        },
        {
          '@type': 'Course',
          name: locale === 'bengali' ? 'এনসিটিবি পাঠ্যক্রম' : 'NCTB Curriculum',
          description: locale === 'bengali'
            ? 'জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ডের অনুমোদিত পাঠ্যক্রম'
            : 'National Curriculum and Textbook Board approved curriculum',
        },
      ],
    },
    
    // Social Media
    sameAs: [
      'https://www.facebook.com/madrasatul.quran',
      'https://www.youtube.com/c/madrasatulquran',
    ],
    
    // Accreditation
    accreditedBy: {
      '@type': 'Organization',
      name: locale === 'bengali' ? 'বাংলাদেশ মাদরাসা শিক্ষা বোর্ড' : 'Bangladesh Madrasah Education Board',
    },
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>,
  locale: 'bengali' | 'english'
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
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
 * Generate local business structured data
 */
export function generateLocalBusinessStructuredData(locale: 'bengali' | 'english') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#localbusiness`,
    name: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
    description: locale === 'bengali'
      ? 'ঢাকার একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান'
      : 'A leading Islamic educational institution in Dhaka',
    
    // Location
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'House 123, Road 456',
      addressLocality: 'Dhaka',
      addressRegion: 'Dhaka Division',
      postalCode: '1000',
      addressCountry: 'BD',
    },
    
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 23.8103,
      longitude: 90.4125,
    },
    
    // Contact
    telephone: '+880-2-1234567',
    email: 'info@madrasatul-quran.edu.bd',
    url: baseUrl,
    
    // Business Hours
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '08:00',
        closes: '15:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Friday',
        opens: '08:00',
        closes: '11:30',
      },
    ],
    
    // Services
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: locale === 'bengali' ? 'শিক্ষা সেবা' : 'Educational Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'bengali' ? 'প্রাথমিক শিক্ষা' : 'Primary Education',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'bengali' ? 'মাধ্যমিক শিক্ষা' : 'Secondary Education',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Education',
          },
        },
      ],
    },
    
    // Reviews and Ratings
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    
    // Social Media
    sameAs: [
      'https://www.facebook.com/madrasatul.quran',
      'https://www.youtube.com/c/madrasatulquran',
    ],
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