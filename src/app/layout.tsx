import { getLocale } from 'next-intl/server';
import { languageTag } from '@/lib/locale-tags';
import { getSiteUrl } from '@/lib/site-url';
import { SOCIAL_IMAGE } from '@/lib/page-metadata';
import type { Locale } from '@/lib/i18n';
import type { Metadata, Viewport } from 'next';
import { PageErrorBoundary } from '@/components/error-boundary';
import { AnalyticsShell } from '@/components/analytics/analytics-shell';
import { siteFontVariables } from '@/lib/fonts';
import './globals.css';

// Browser chrome color: the header's paper surface (--color-paper).
export const viewport: Viewport = {
  themeColor: '#fbf7ef',
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: '%s | Madrasatul Quran',
    default: 'Madrasatul Quran, Uttara | Islamic and general education',
  },
  description: 'At Madrasatul Quran in Uttara, Dhaka, Islamic and general education are given equal weight in one ten-year plan. Day-care hifz with general study alongside. Nursery to Class 11.',
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
    title: 'Madrasatul Quran, Uttara | Islamic and general education',
    description: 'At Madrasatul Quran in Uttara, Dhaka, Islamic and general education are given equal weight in one ten-year plan. Day-care hifz with general study alongside. Nursery to Class 11.',
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
    title: 'Madrasatul Quran, Uttara | Islamic and general education',
    description: 'At Madrasatul Quran in Uttara, Dhaka, Islamic and general education are given equal weight in one ten-year plan. Day-care hifz with general study alongside. Nursery to Class 11.',
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
    <html lang={languageTag(locale)} className={siteFontVariables}>
      <body className={`${locale === 'bengali' ? 'font-bengali' : 'font-english'} antialiased`}>
        <AnalyticsShell>
          <PageErrorBoundary>{children}</PageErrorBoundary>
        </AnalyticsShell>
      </body>
    </html>
  );
}
