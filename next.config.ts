import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

const nextConfig: NextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);
