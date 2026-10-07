import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

const nextConfig: NextConfig = {
  // Application PDFs (src/lib/admissions/pdf.ts): Chromium is loaded at runtime, not bundled, and
  // the embedded fonts are read from node_modules.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-{400,600,700}-normal.woff2',
      './node_modules/@fontsource/inter/files/inter-latin-{400,600,700}-normal.woff2',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next 16 defaults qualities to [75]; OptimizedImage uses quality={90}.
    qualities: [75, 90],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // ERP student lists are uploaded through a server action (survey admin import, max 5 MB).
    serverActions: { bodySizeLimit: '5mb' },
  },
  // Enable compression
  compress: true,
  async headers() {
    return [
      // Survey links carry a key in the URL and personal answers: never index, cache or refer them.
      ...['/survey/:path*', '/admin/:path*'].map((source) => ({
        source,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      })),
      {
        source: '/:locale(bengali|english)/downloads/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
