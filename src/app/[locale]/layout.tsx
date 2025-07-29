import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Noto_Sans_Bengali, Amiri } from 'next/font/google';
import { locales } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-english',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
});

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
    <html lang={locale} dir={locale === 'arabic' ? 'rtl' : 'ltr'}>
      <body
        className={`${inter.variable} ${notoSansBengali.variable} ${amiri.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
