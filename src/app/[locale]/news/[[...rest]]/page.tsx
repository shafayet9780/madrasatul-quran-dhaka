import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';

/** The old News and Events pages are gone; their links lead to the notice board, or home while the board is off. */
export default async function OldNewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getContentService(false).getSiteSettings();
  redirect(isSectionVisible('notices', settings?.navigationVisibility) ? `/${locale}/notices` : `/${locale}`);
}
