import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
}

/**
 * Generate sitemap for static pages - MVP version
 */
export function generateStaticSitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/contact',
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    },
    // Temporarily hidden for MVP launch - uncomment when ready
    // {
    //   path: '/about',
    //   priority: 0.9,
    //   changeFrequency: 'monthly' as const,
    // },
    // {
    //   path: '/programs',
    //   priority: 0.9,
    //   changeFrequency: 'monthly' as const,
    // },
    // {
    //   path: '/admissions',
    //   priority: 0.8,
    //   changeFrequency: 'monthly' as const,
    // },
    // {
    //   path: '/campus',
    //   priority: 0.7,
    //   changeFrequency: 'monthly' as const,
    // },
    // {
    //   path: '/news',
    //   priority: 0.8,
    //   changeFrequency: 'daily' as const,
    // },
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  staticPages.forEach((page) => {
    // Add Bengali version
    sitemap.push({
      url: `${baseUrl}/bengali${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali${page.path}`,
          'en-US': `${baseUrl}/english${page.path}`,
        },
      },
    });

    // Add English version
    sitemap.push({
      url: `${baseUrl}/english${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          'bn-BD': `${baseUrl}/bengali${page.path}`,
          'en-US': `${baseUrl}/english${page.path}`,
        },
      },
    });
  });

  return sitemap;
}

/**
 * Generate sitemap for dynamic content (news, events)
 */
export async function generateDynamicSitemap(): Promise<MetadataRoute.Sitemap> {
  // This would typically fetch from your CMS
  // For now, we'll return an empty array as a placeholder
  const dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // Example: Fetch news articles from Sanity
    // const newsArticles = await sanityClient.fetch(`
    //   *[_type == "newsEvent" && defined(slug.current)] {
    //     slug,
    //     _updatedAt,
    //     publishedAt
    //   }
    // `);

    // newsArticles.forEach((article: any) => {
    //   dynamicPages.push({
    //     url: `${baseUrl}/bengali/news/${article.slug.current}`,
    //     lastModified: new Date(article._updatedAt),
    //     changeFrequency: 'monthly',
    //     priority: 0.6,
    //     alternates: {
    //       languages: {
    //         'bn-BD': `${baseUrl}/bengali/news/${article.slug.current}`,
    //         'en-US': `${baseUrl}/english/news/${article.slug.current}`,
    //       },
    //     },
    //   });
    // });
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
  }

  return dynamicPages;
}

/**
 * Generate complete sitemap
 */
export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  const staticSitemap = generateStaticSitemap();
  const dynamicSitemap = await generateDynamicSitemap();

  return [...staticSitemap, ...dynamicSitemap];
}

/**
 * Generate sitemap index for large sites
 */
export function generateSitemapIndex(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/sitemap-static.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-news.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-images.xml`,
      lastModified: new Date(),
    },
  ];
}

/**
 * Generate image sitemap
 */
export function generateImageSitemap(): string {
  const images = [
    {
      url: `${baseUrl}/images/campus-main.jpg`,
      caption: 'Madrasatul Quran Main Campus',
      title: 'Main Campus Building',
      license: `${baseUrl}/license`,
    },
    {
      url: `${baseUrl}/images/prayer-hall.jpg`,
      caption: 'Prayer Hall',
      title: 'Islamic Prayer Hall',
    },
    {
      url: `${baseUrl}/images/library.jpg`,
      caption: 'School Library',
      title: 'Modern Library Facilities',
    },
    {
      url: `${baseUrl}/images/classroom.jpg`,
      caption: 'Modern Classroom',
      title: 'Interactive Learning Environment',
    },
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${images.map(image => `
  <url>
    <loc>${baseUrl}/</loc>
    <image:image>
      <image:loc>${image.url}</image:loc>
      <image:caption>${image.caption}</image:caption>
      <image:title>${image.title}</image:title>
      ${image.license ? `<image:license>${image.license}</image:license>` : ''}
    </image:image>
  </url>`).join('')}
</urlset>`;

  return xmlContent;
}

/**
 * Generate news sitemap for Google News
 */
export function generateNewsSitemap(): string {
  // This would typically fetch recent news from your CMS
  const newsArticles = [
    {
      url: `${baseUrl}/bengali/news/annual-prize-distribution`,
      title: 'Annual Prize Distribution Ceremony',
      publishedAt: '2024-01-15T10:00:00Z',
      language: 'bn',
    },
    {
      url: `${baseUrl}/english/news/annual-prize-distribution`,
      title: 'Annual Prize Distribution Ceremony',
      publishedAt: '2024-01-15T10:00:00Z',
      language: 'en',
    },
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsArticles.map(article => `
  <url>
    <loc>${article.url}</loc>
    <news:news>
      <news:publication>
        <news:name>Madrasatul Quran</news:name>
        <news:language>${article.language}</news:language>
      </news:publication>
      <news:publication_date>${article.publishedAt}</news:publication_date>
      <news:title>${article.title}</news:title>
    </news:news>
  </url>`).join('')}
</urlset>`;

  return xmlContent;
}