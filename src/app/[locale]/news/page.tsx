import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewsEventsPage } from '@/components/news-events';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default function NewsPage() {
  return <NewsEventsPage />;
}