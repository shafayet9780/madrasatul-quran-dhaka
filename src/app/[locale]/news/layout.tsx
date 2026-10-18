import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';

/** The old News and Events pages (filters, cards, calendar, gallery): their text in the browser. */
export default async function NewsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ClientMessages locale={locale} keys={['news']}>
      {children}
    </ClientMessages>
  );
}
