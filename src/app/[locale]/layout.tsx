import type { Metadata, Viewport } from 'next';
import { preload } from 'react-dom';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
// import { SpeedInsights } from '@vercel/speed-insights/next';
import { locales } from '@/lib/i18n';
import { localModeRequested } from '@/lib/admissions/local';
import { languageTag } from '@/lib/locale-tags';
import { getSiteUrl } from '@/lib/site-url';
import { SITE_DESCRIPTION, SOCIAL_IMAGE } from '@/lib/page-metadata';
import { sharePicture } from '@/lib/page-seo';
import { ANEK_BANGLA_URL, siteFontVariables } from '@/lib/fonts';
import { pickMessages, SHARED_CLIENT_MESSAGES } from '@/lib/i18n-messages';
import LocaleProvider from '@/components/locale-provider';
import { LanguageContextProvider } from '@/contexts/language-context';
import { MainLayout, SiteHeader, SiteFooter } from '@/components/layout';
import { ConsentBanner } from '@/components/analytics/consent-banner';
import { AnalyticsShell } from '@/components/analytics/analytics-shell';
import { PageErrorBoundary } from '@/components/error-boundary';
import { getContentService } from '@/lib/content-service';
import { getAdmissionCta } from '@/lib/admissions/pages';
import { asLocale } from '@/lib/admissions/display';
import '../globals.css';

// The public site's root layout: the page's language sets <html lang>, and pages are built ahead of time and refreshed
// from the CMS (setRequestLocale here and in each page). /admin, /survey and /studio have their own root layouts.

export function generateStaticParams() {
  // The local preview's data (src/instrumentation.ts) exists only once the server runs: there, pages are built on
  // their first visit instead.
  return localModeRequested() ? [] : locales.map((locale) => ({ locale }));
}

// Browser chrome color: the header's paper surface (--color-paper).
export const viewport: Viewport = {
  themeColor: '#fbf7ef',
};

const TITLE = 'Madrasatul Quran, Uttara | Islamic and general education';

/**
 * The site's defaults; each page sets its own title, description and links. Page titles end with the school's name in
 * the page's language; a page that sets none (a not-found page) is titled with the name alone. The description and the
 * share picture come from Studio → Search & sharing when filled in.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) return {};
  const [t, seo] = await Promise.all([getTranslations({ locale, namespace: 'site' }), getContentService(false).getSeoSettings()]);
  const description = seo?.description?.[locale]?.trim() || SITE_DESCRIPTION;
  const share = sharePicture(seo, locale) ?? { url: SOCIAL_IMAGE, alt: 'Madrasatul Quran school building' };
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { template: `%s | ${t('schoolName')}`, absolute: t('schoolName') },
    description,
    keywords: ['Islamic education', 'Madrasah', 'Quran', 'Hadith', 'Dhaka', 'Bangladesh', 'Educational institution'],
    authors: [{ name: 'Madrasatul Quran' }],
    creator: 'Madrasatul Quran',
    publisher: 'Madrasatul Quran',
    // Icons: served from Sanity siteSettings.favicon via /api/favicon.
    icons: {
      icon: [{ url: '/api/favicon', sizes: '32x32', type: 'image/png' }],
      shortcut: ['/api/favicon'],
      apple: [{ url: '/api/favicon', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: getSiteUrl(),
      siteName: 'Madrasatul Quran',
      title: TITLE,
      description,
      images: [{ url: share.url, width: 1200, height: 630, alt: share.alt }],
    },
    twitter: { card: 'summary_large_image', title: TITLE, description, images: [share.url] },
    // Optional Search Console verification; omit unconfigured tokens.
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    other: { 'geo.region': 'BD-13', 'geo.placename': 'Dhaka' },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  setRequestLocale(locale);
  // A Bengali page needs the Bengali font from its first line; an English page fetches it only if Bengali text shows.
  if (locale === 'bengali') preload(ANEK_BANGLA_URL, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });

  // School details (cached) feed the server-rendered header and footer.
  const contentService = getContentService(false);
  const [messages, siteSettings, admissionCta, t] = await Promise.all([
    getMessages(),
    contentService.getSiteSettings(),
    getAdmissionCta(asLocale(locale)),
    getTranslations({ locale, namespace: 'site' }),
  ]);

  return (
    <html lang={languageTag(locale)} className={siteFontVariables}>
      <body className={`${locale === 'bengali' ? 'font-bengali' : 'font-english'} antialiased`}>
        <AnalyticsShell>
          <PageErrorBoundary>
            <LocaleProvider locale={locale}>
              {/* The browser gets the shared messages only; a page with its own client text adds them (its layout). */}
              <NextIntlClientProvider messages={pickMessages(messages, SHARED_CLIENT_MESSAGES)}>
                <LanguageContextProvider>
                  <MainLayout
                    header={<SiteHeader locale={asLocale(locale)} siteSettings={siteSettings} />}
                    footer={<SiteFooter locale={asLocale(locale)} siteSettings={siteSettings} />}
                    skipLabel={t('skip')}
                    admissionCta={admissionCta}
                  >
                    {children}
                  </MainLayout>
                  <ConsentBanner />
                  {/* <SpeedInsights /> */}
                </LanguageContextProvider>
              </NextIntlClientProvider>
            </LocaleProvider>
          </PageErrorBoundary>
        </AnalyticsShell>
      </body>
    </html>
  );
}
