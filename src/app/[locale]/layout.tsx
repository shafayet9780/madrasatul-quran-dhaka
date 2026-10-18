import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
// import { SpeedInsights } from '@vercel/speed-insights/next';
import { locales } from '@/lib/i18n';
import LocaleProvider from '@/components/locale-provider';
import { LanguageContextProvider } from '@/contexts/language-context';
import { MainLayout, SiteHeader, SiteFooter } from '@/components/layout';
import { ConsentBanner } from '@/components/analytics/consent-banner';
import { getContentService } from '@/lib/content-service';
import { getAdmissionCta } from '@/lib/admissions/pages';
import { asLocale } from '@/lib/admissions/display';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

/**
 * Page titles end with the school's name in the page's language (a page can still set its whole title). A page that
 * sets none (a not-found page) is titled with the name alone; `absolute`, or the root's English ending would follow it.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) return {};
  const t = await getTranslations({ locale, namespace: 'site' });
  return { title: { template: `%s | ${t('schoolName')}`, absolute: t('schoolName') } };
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

  // Site and footer settings (cached) feed the server-rendered header and footer.
  const contentService = getContentService(false);
  const [siteSettings, footerSettings, admissionCta, t] = await Promise.all([
    contentService.getSiteSettings(),
    contentService.getFooterSettings(),
    getAdmissionCta(asLocale(locale)),
    getTranslations({ locale, namespace: 'site' }),
  ]);

  return (
    <LocaleProvider locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <LanguageContextProvider>
          <MainLayout
            header={<SiteHeader locale={asLocale(locale)} siteSettings={siteSettings} />}
            footer={<SiteFooter locale={asLocale(locale)} siteSettings={siteSettings} footerSettings={footerSettings} />}
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
  );
}
