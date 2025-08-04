import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n';
import LocaleProvider from '@/components/locale-provider';
import { LanguageContextProvider } from '@/contexts/language-context';
import { MainLayout } from '@/components/layout';

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

  return (
    <LocaleProvider locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <LanguageContextProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </LanguageContextProvider>
      </NextIntlClientProvider>
    </LocaleProvider>
  );
}
