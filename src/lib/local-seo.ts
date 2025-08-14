/**
 * Local SEO optimization for Dhaka-based searches
 */

export interface LocalBusinessInfo {
  name: {
    bengali: string;
    english: string;
  };
  address: {
    street: string;
    area: string;
    city: string;
    division: string;
    postalCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  hours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
}

/**
 * Local business information for Madrasatul Quran
 */
export const localBusinessInfo: LocalBusinessInfo = {
  name: {
    bengali: 'মাদরাসাতুল কুরআন',
    english: 'Madrasatul Quran',
  },
  address: {
    street: 'House 123, Road 456',
    area: 'Dhanmondi',
    city: 'Dhaka',
    division: 'Dhaka Division',
    postalCode: '1205',
    country: 'Bangladesh',
  },
  coordinates: {
    latitude: 23.8103,
    longitude: 90.4125,
  },
  contact: {
    phone: '+880-2-1234567',
    email: 'info@madrasatul-quran.edu.bd',
    website: 'https://madrasatul-quran.edu.bd',
  },
  hours: {
    sunday: { open: '08:00', close: '15:00' },
    monday: { open: '08:00', close: '15:00' },
    tuesday: { open: '08:00', close: '15:00' },
    wednesday: { open: '08:00', close: '15:00' },
    thursday: { open: '08:00', close: '15:00' },
    friday: { open: '08:00', close: '11:30' },
    saturday: { closed: true },
  },
};

/**
 * Generate local business keywords for Dhaka
 */
export function generateLocalKeywords(locale: 'bengali' | 'english'): string[] {
  const baseKeywords = locale === 'bengali' ? [
    'ঢাকার ইসলামী স্কুল',
    'ধানমন্ডি মাদরাসা',
    'বাংলাদেশের ইসলামী শিক্ষা',
    'ঢাকার কুরআন স্কুল',
    'ইসলামী শিক্ষা প্রতিষ্ঠান ঢাকা',
    'মাদরাসা ভর্তি ঢাকা',
    'কুরআন মুখস্থকরণ ঢাকা',
    'ইসলামী স্কুল বাংলাদেশ',
    'ধর্মীয় শিক্ষা ঢাকা',
    'হাফেজ প্রশিক্ষণ ঢাকা',
  ] : [
    'Islamic school Dhaka',
    'Madrasah Dhanmondi',
    'Islamic education Bangladesh',
    'Quran school Dhaka',
    'Islamic institution Dhaka',
    'Madrasah admission Dhaka',
    'Quran memorization Dhaka',
    'Islamic school Bangladesh',
    'Religious education Dhaka',
    'Hafez training Dhaka',
  ];

  const locationKeywords = locale === 'bengali' ? [
    'ধানমন্ডি',
    'ঢাকা',
    'বাংলাদেশ',
    'ঢাকা বিভাগ',
    'কেন্দ্রীয় ঢাকা',
  ] : [
    'Dhanmondi',
    'Dhaka',
    'Bangladesh',
    'Dhaka Division',
    'Central Dhaka',
  ];

  return [...baseKeywords, ...locationKeywords];
}

/**
 * Generate local business structured data
 */
export function generateLocalBusinessStructuredData(locale: 'bengali' | 'english') {
  const business = localBusinessInfo;
  
  return {
    '@context': 'https://schema.org',
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': `${business.contact.website}/#organization`,
    
    // Basic Information
    name: business.name[locale],
    alternateName: business.name[locale === 'bengali' ? 'english' : 'bengali'],
    description: locale === 'bengali'
      ? 'ঢাকার ধানমন্ডিতে অবস্থিত একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান যা ঐতিহ্যবাহী ইসলামী শিক্ষার সাথে আধুনিক শিক্ষার সমন্বয় করে।'
      : 'A leading Islamic educational institution located in Dhanmondi, Dhaka, combining traditional Islamic education with modern curriculum.',
    
    // Location
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.area,
      addressRegion: business.address.division,
      postalCode: business.address.postalCode,
      addressCountry: 'BD',
    },
    
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.coordinates.latitude,
      longitude: business.coordinates.longitude,
    },
    
    // Contact Information
    telephone: business.contact.phone,
    email: business.contact.email,
    url: business.contact.website,
    
    // Service Area
    areaServed: [
      {
        '@type': 'City',
        name: 'Dhaka',
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Dhaka Division',
          containedInPlace: {
            '@type': 'Country',
            name: 'Bangladesh',
          },
        },
      },
    ],
    
    // Opening Hours
    openingHoursSpecification: Object.entries(business.hours)
      .filter(([_, hours]) => !hours.closed)
      .map(([day, hours]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
        opens: hours.open,
        closes: hours.close,
      })),
    
    // Services
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: locale === 'bengali' ? 'শিক্ষা সেবা' : 'Educational Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'EducationalOccupationalProgram',
            name: locale === 'bengali' ? 'কুরআন মুখস্থকরণ' : 'Quran Memorization',
            description: locale === 'bengali'
              ? 'সম্পূর্ণ কুরআন মুখস্থকরণের জন্য বিশেষ কার্যক্রম'
              : 'Specialized program for complete Quran memorization',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'EducationalOccupationalProgram',
            name: locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Studies',
            description: locale === 'bengali'
              ? 'হাদিস, ফিকহ, আরবি ভাষা এবং ইসলামী ইতিহাস'
              : 'Hadith, Fiqh, Arabic language, and Islamic history',
          },
        },
      ],
    },
    
    // Reviews (placeholder)
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
 * Generate local SEO meta tags
 */
export function generateLocalSEOTags(locale: 'bengali' | 'english') {
  const business = localBusinessInfo;
  const keywords = generateLocalKeywords(locale);
  
  return {
    'geo.region': 'BD-13', // Dhaka division code
    'geo.placename': 'Dhaka',
    'geo.position': `${business.coordinates.latitude};${business.coordinates.longitude}`,
    'ICBM': `${business.coordinates.latitude}, ${business.coordinates.longitude}`,
    'DC.title': business.name[locale],
    'DC.creator': business.name[locale],
    'DC.subject': keywords.slice(0, 5).join(', '),
    'DC.description': locale === 'bengali'
      ? 'ঢাকার ধানমন্ডিতে অবস্থিত ইসলামী শিক্ষা প্রতিষ্ঠান'
      : 'Islamic educational institution located in Dhanmondi, Dhaka',
    'DC.publisher': business.name[locale],
    'DC.contributor': business.name[locale],
    'DC.date': new Date().toISOString(),
    'DC.type': 'Text',
    'DC.format': 'text/html',
    'DC.identifier': business.contact.website,
    'DC.source': business.contact.website,
    'DC.language': locale === 'bengali' ? 'bn-BD' : 'en-US',
    'DC.coverage': 'Dhaka, Bangladesh',
    'DC.rights': `© ${new Date().getFullYear()} ${business.name[locale]}`,
  };
}

/**
 * Generate hreflang tags for international SEO
 */
export function generateHreflangTags(currentPath: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
  return {
    'hreflang-bn-BD': `${baseUrl}/bengali${currentPath}`,
    'hreflang-en-US': `${baseUrl}/english${currentPath}`,
    'hreflang-x-default': `${baseUrl}/english${currentPath}`, // Default to English
  };
}

/**
 * Generate local business JSON-LD for Google My Business
 */
export function generateGoogleMyBusinessData(locale: 'bengali' | 'english') {
  const business = localBusinessInfo;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${business.contact.website}/#gmb`,
    
    name: business.name[locale],
    image: `${business.contact.website}/images/campus-main.jpg`,
    description: locale === 'bengali'
      ? 'ঢাকার ধানমন্ডিতে অবস্থিত একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান'
      : 'A leading Islamic educational institution in Dhanmondi, Dhaka',
    
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.area,
      addressRegion: business.address.division,
      postalCode: business.address.postalCode,
      addressCountry: 'BD',
    },
    
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.coordinates.latitude,
      longitude: business.coordinates.longitude,
    },
    
    url: business.contact.website,
    telephone: business.contact.phone,
    email: business.contact.email,
    
    priceRange: '$$',
    
    openingHoursSpecification: Object.entries(business.hours)
      .filter(([_, hours]) => !hours.closed)
      .map(([day, hours]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${day.charAt(0).toUpperCase() + day.slice(1)}`,
        opens: hours.open,
        closes: hours.close,
      })),
    
    sameAs: [
      'https://www.facebook.com/madrasatul.quran',
      'https://www.youtube.com/c/madrasatulquran',
    ],
  };
}