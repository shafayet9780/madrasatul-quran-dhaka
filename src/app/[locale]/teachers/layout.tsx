import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';

/** The teachers list and profiles (filters, cards): their text in the browser. */
export default async function TeachersLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ClientMessages locale={locale} keys={['people', 'seniority', 'teachers']}>
      {children}
    </ClientMessages>
  );
}
