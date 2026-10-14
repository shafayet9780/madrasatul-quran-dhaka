import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/survey',
          '/api/auth/',
          '/api/private/',
          '/studio',
          '/bengali/downloads',
          '/english/downloads',
        ],
      },
      {
        // SEO-tool crawlers only. AI assistants and search (ChatGPT, Claude, Perplexity, Gemini) follow the rule
        // above, so they can read the public pages when a guardian asks them about the school.
        userAgent: ['SemrushBot', 'AhrefsBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
