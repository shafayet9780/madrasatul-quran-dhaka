import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
  return [
    {
      url: `${baseUrl}/bengali`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali`,
          'en-US': `${baseUrl}/english`,
        },
      },
    },
    {
      url: `${baseUrl}/english`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali`,
          'en-US': `${baseUrl}/english`,
        },
      },
    },
    {
      url: `${baseUrl}/bengali/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/contact`,
          'en-US': `${baseUrl}/english/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/english/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/contact`,
          'en-US': `${baseUrl}/english/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/bengali/curriculum`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/curriculum`,
          'en-US': `${baseUrl}/english/curriculum`,
        },
      },
    },
    {
      url: `${baseUrl}/english/curriculum`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/curriculum`,
          'en-US': `${baseUrl}/english/curriculum`,
        },
      },
    },
    {
      url: `${baseUrl}/bengali/pre-admission`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/pre-admission`,
          'en-US': `${baseUrl}/english/pre-admission`,
        },
      },
    },
    {
      url: `${baseUrl}/english/pre-admission`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali/pre-admission`,
          'en-US': `${baseUrl}/english/pre-admission`,
        },
      },
    },
  ];
}