import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getNewsEventBySlug } from '@/lib/queries/news-events';
import { NewsArticlePage } from '@/components/news-events/news-article-page';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Built on its first visit, then cached and refreshed from the CMS like the other pages.
export function generateStaticParams() {
  return [];
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
    // The old design, with sample news: kept out of search until the page is redesigned.
    robots: { index: false, follow: true },
  };
}

export default async function NewsArticle({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const language = locale as 'bengali' | 'english';
  
  const newsEvent = await getNewsEventBySlug(slug, language);

  if (!newsEvent) {
    notFound();
  }

  return <NewsArticlePage newsEvent={newsEvent} />;
}