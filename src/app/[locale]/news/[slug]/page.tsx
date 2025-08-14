import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getNewsEventBySlug } from '@/lib/queries/news-events';
import { NewsArticlePage } from '@/components/news-events/news-article-page';

interface Props {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale as 'bengali' | 'english';
  
  const newsEvent = await getNewsEventBySlug(slug, language);
  
  if (!newsEvent) {
    return {
      title: 'News Not Found',
    };
  }

  return {
    title: newsEvent.title[language],
    description: newsEvent.excerpt?.[language] || newsEvent.title[language],
  };
}

export default async function NewsArticle({ params }: Props) {
  const { locale, slug } = await params;
  const language = locale as 'bengali' | 'english';
  
  const newsEvent = await getNewsEventBySlug(slug, language);

  if (!newsEvent) {
    notFound();
  }

  return <NewsArticlePage newsEvent={newsEvent} />;
}