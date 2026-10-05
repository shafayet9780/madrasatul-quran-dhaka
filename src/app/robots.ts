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
        // Preserve the existing restrictions on AI training and selected crawlers.
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
