import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NewsEventsPage } from '@/components/news-events';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });

  return {
    // The title already ends with the school's name.
    title: { absolute: t('meta.title') },
    description: t('meta.description'),
    // The old design, with sample news: kept out of search until the page is redesigned.
    robots: { index: false, follow: true },
  };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <NewsEventsPage />;
}