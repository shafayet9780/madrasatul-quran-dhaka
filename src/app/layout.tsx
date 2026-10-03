import { getLocale } from 'next-intl/server';
import { languageTag } from '@/lib/locale-tags';
import { getSiteUrl } from '@/lib/site-url';
import { SOCIAL_IMAGE } from '@/lib/page-metadata';
import type { Locale } from '@/lib/i18n';
import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Bengali, Amiri } from 'next/font/google';
import { PageErrorBoundary } from '@/components/error-boundary';
import { AnalyticsShell } from '@/components/analytics/analytics-shell';
import './globals.css';

// Font configurations with optimized loading
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-english',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
  preload: true,
  fallback: ['SolaimanLipi', 'Kalpurush', 'sans-serif'],
  adjustFontFallback: true,
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false, // Load on demand for Arabic text
  fallback: ['Times New Roman', 'serif'],
  adjustFontFallback: true,
});

// Browser chrome color — matches the light navbar surface.
export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: '%s | Madrasatul Quran',
    default: 'Madrasatul Quran - Excellence in Islamic Education',
  },
  description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
  keywords: ['Islamic education', 'Madrasah', 'Quran', 'Hadith', 'Dhaka', 'Bangladesh', 'Educational institution'],
  authors: [{ name: 'Madrasatul Quran' }],
  creator: 'Madrasatul Quran',
  publisher: 'Madrasatul Quran',
  
  // Icons — served from Sanity siteSettings.favicon via /api/favicon.
  // (The default app/favicon.ico file was removed so it stops overriding this.)
  icons: {
    icon: [{ url: '/api/favicon', sizes: '32x32', type: 'image/png' }],
    shortcut: ['/api/favicon'],
    apple: [{ url: '/api/favicon', sizes: '180x180', type: 'image/png' }],
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getSiteUrl(),
    siteName: 'Madrasatul Quran',
    title: 'Madrasatul Quran - Excellence in Islamic Education',
    description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Madrasatul Quran school building',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Madrasatul Quran - Excellence in Islamic Education',
    description: 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development',
    images: [SOCIAL_IMAGE],
  },
  
  // Optional Search Console verification; omit unconfigured tokens.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  
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
  
  // Additional meta tags
  other: {
    'geo.region': 'BD-13',
    'geo.placename': 'Dhaka',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  return (
    <html lang={languageTag(locale)} className={`${inter.variable} ${notoSansBengali.variable} ${amiri.variable}`}>
      <body className={`${locale === 'bengali' ? 'font-bengali' : 'font-english'} antialiased`}>
        <AnalyticsShell>
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </AnalyticsShell>
      </body>
    </html>
  );
}
