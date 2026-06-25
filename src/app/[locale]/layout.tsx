import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
// import { SpeedInsights } from '@vercel/speed-insights/next';
import { locales } from '@/lib/i18n';
import LocaleProvider from '@/components/locale-provider';
import { LanguageContextProvider } from '@/contexts/language-context';
import { MainLayout } from '@/components/layout';
import { ConsentBanner } from '@/components/analytics/consent-banner';
import { getContentService } from '@/lib/content-service';
import { getPeopleNav } from '@/lib/queries/site';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as (typeof locales)[number])) notFound();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Fetch site/footer settings server-side (cached) and pass to the client
  // layout as props.
  const contentService = getContentService(false);
  const [siteSettings, footerSettings, peopleNav] = await Promise.all([
    contentService.getSiteSettings(),
    contentService.getFooterSettings(),
    getPeopleNav(),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <LanguageContextProvider>
          <MainLayout siteSettings={siteSettings} footerSettings={footerSettings} peopleNav={peopleNav}>
            {children}
          </MainLayout>
          <ConsentBanner />
          {/* <SpeedInsights /> */}
        </LanguageContextProvider>
      </NextIntlClientProvider>
    </LocaleProvider>
  );
}
