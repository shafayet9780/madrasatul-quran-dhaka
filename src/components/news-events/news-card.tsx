'use client';

import { CardImage } from '@/components/ui/optimized-image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { NewsEvent } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';

interface NewsCardProps {
  event: NewsEvent;
}

export function NewsCard({ event }: NewsCardProps) {
  const t = useTranslations('news.card');
  const locale = useLocale();
  const language = locale as 'bengali' | 'english';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'bengali' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800';
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'news':
        return 'bg-green-100 text-green-800';
      case 'announcement':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`categories.${category}`);
  };

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Featured Image */}
      <div className="relative h-48 w-full">
        <CardImage
          image={event.featuredImage}
          alt={event.featuredImage.alt}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
            {getCategoryLabel(event.category)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Date */}
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(event.eventDate || event.publishedAt)}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 font-bengali line-clamp-2">
          {event.title[language]}
        </h3>

        {/* Excerpt */}
        {event.excerpt?.[language] && (
          <p className="text-gray-600 mb-4 line-clamp-3 font-bengali">
            {event.excerpt[language]}
          </p>
        )}

        {/* Read More Link */}
        <Link
          href={`/news/${event.slug[language].current}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          {t('readMore')}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}