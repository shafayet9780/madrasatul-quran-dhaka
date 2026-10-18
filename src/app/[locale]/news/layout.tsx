import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';

/**
 * The old News and Events pages (filters, cards, calendar, gallery): their text in the browser. Once the notice board is
 * switched on, they lead to it (docs/notices.md).
 */
export default async function NewsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getContentService(false).getSiteSettings();
  if (isSectionVisible('notices', settings?.navigationVisibility)) redirect(`/${locale}/notices`);
  return (
    <ClientMessages locale={locale} keys={['news']}>
      {children}
    </ClientMessages>
  );
}
