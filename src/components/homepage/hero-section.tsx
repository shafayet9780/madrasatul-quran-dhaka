'use client';

import { useTranslations } from 'next-intl';
import { HeroImage } from '@/components/ui/optimized-image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import type { SiteSettings, NewsEvent } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { useLocale } from 'next-intl';

interface HeroSectionProps {
  className?: string;
  siteSettings?: SiteSettings | null;
  featuredNews?: NewsEvent[];
}

export default function HeroSection({
  className = '',
  siteSettings,
  featuredNews = [],
}: HeroSectionProps) {
  const t = useTranslations('homepage');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'bengali' | 'english';
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Activity images for the gallery
  const activityImages = [
    {
      src: '/images/activities/classroom-learning.jpg',
      alt: 'Students in classroom learning session',
      title: 'Interactive Learning',
    },
    {
      src: '/images/activities/quran-recitation.jpg',
      alt: 'Students reciting Quran',
      title: 'Quran Recitation',
    },
    {
      src: '/images/activities/science-lab.jpg',
      alt: 'Students in science laboratory',
      title: 'Science Laboratory',
    },
    {
      src: '/images/activities/sports-activities.jpg',
      alt: 'Students participating in sports',
      title: 'Sports & Recreation',
    },
    {
      src: '/images/activities/cultural-program.jpg',
      alt: 'Cultural program performance',
      title: 'Cultural Programs',
    },
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate activity images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % activityImages.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [activityImages.length]);

  // Latest news data from Sanity or fallback
  const latestNews =
    featuredNews.length > 0
      ? featuredNews.slice(0, 5).map((news, index) => {
          const publishDate = new Date(news.publishedAt);
          return {
            date: publishDate.getDate().toString(),
            month: publishDate.toLocaleDateString(
              locale === 'bengali' ? 'bn-BD' : 'en-US',
              { month: 'short' }
            ),
            title: getLocalizedText(news.title, locale),
            isHighlight: index === 0 || news.featured,
          };
        })
      : [
          {
            date: '18',
            month: 'Jan',
            title:
              'Alhamdulillah, admission for the Session 2025-2026 is open for the children of age 4 to 6 years at Preschool',
            isHighlight: true,
          },
          {
            date: '16',
            month: 'Jan',
            title:
              'Classes of Session 2025-2026 will start on 15 July 2025, Insha Allah',
            isHighlight: false,
          },
          {
            date: '15',
            month: 'Jan',
            title:
              'Annual Quran Competition Results - Our students achieved remarkable success',
            isHighlight: false,
          },
        ];

  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Auto-scroll news
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % latestNews.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [latestNews.length]);

  return (
    <section className={`relative bg-white ${className}`}>
      {/* Main Hero Section */}
      <div className="container-custom py-6 lg:py-8">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Left - Full Image Section with Title Above */}
          <div
            className={`col-span-12 lg:col-span-9 space-y-3 transition-all duration-1000 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-8'
            }`}
          >
            {/* Ultra Compact Title Section */}
            <div className="text-center space-y-1">
              {/* Institution Badge */}
              <div className="inline-flex items-center bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 text-xs font-medium">
                <span className="mr-1">🏛️</span>
                Est. 2010
              </div>

              {/* Main Title */}
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 leading-tight">
                {siteSettings
                  ? getLocalizedText(siteSettings.title, locale)
                  : t('hero.title')}
              </h1>

              {/* Subtitle */}
              <h2 className="text-sm lg:text-base text-gray-600 leading-tight max-w-lg mx-auto">
                {siteSettings
                  ? getLocalizedText(siteSettings.description, locale)
                  : t('hero.subtitle')}
              </h2>
            </div>

            {/* Full Width Image Gallery */}
            <div className="relative h-96 lg:h-[420px] xl:h-[480px] rounded-2xl overflow-hidden shadow-xl">
              {activityImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <HeroImage
                    image={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    onError={() => {
                      console.log(`Failed to load image: ${image.src}`);
                    }}
                  />
                  {/* Image Overlay with Title */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-white font-semibold text-xl lg:text-2xl">
                      {image.title}
                    </h3>
                  </div>
                </div>
              ))}

              {/* Gallery Indicators */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {activityImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-row gap-3 sm:gap-4 justify-center items-center pt-3">
              <Link
                href="/admissions"
                className="group relative bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold px-4 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <span>📝</span>
                <span className="whitespace-nowrap">{tNav('admissions')}</span>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/programs"
                className="group relative bg-white border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold px-4 sm:px-8 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <span>📚</span>
                <span className="whitespace-nowrap">
                  {tCommon('learnMore')}
                </span>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right - Narrow Tall News Sidebar */}
          <div
            className={`col-span-12 lg:col-span-3 transition-all duration-1000 delay-600 ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-8'
            }`}
          >
            {/* Latest News Sidebar - Height matches title + image gallery */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-[480px] lg:h-[520px] xl:h-[580px]">
              {/* News Header */}
              <div className="bg-green-600 text-white px-4 py-3">
                <h3 className="text-sm font-semibold flex items-center">
                  <span className="mr-2">📰</span>
                  Latest News
                </h3>
              </div>

              {/* Scrolling News Content */}
              <div className="h-full overflow-hidden relative">
                <div
                  className="transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateY(-${currentNewsIndex * 80}px)`,
                  }}
                >
                  {latestNews.map((news, index) => (
                    <div
                      key={index}
                      className="flex p-3 border-b border-gray-100 min-h-[80px]"
                    >
                      {/* Compact Date Box */}
                      <div className="flex-shrink-0 mr-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
                            news.isHighlight
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <div className="text-sm leading-none">
                            {news.date}
                          </div>
                          <div className="text-xs">{news.month}</div>
                        </div>
                      </div>

                      {/* News Content */}
                      <div className="flex-1">
                        <p
                          className={`text-xs leading-relaxed ${
                            news.isHighlight
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {news.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View All News Button */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gray-50 border-t border-gray-100">
                <Link
                  href="/news"
                  className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors duration-200 block text-center"
                >
                  View All →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="container-custom">
          <div
            className={`grid grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 delay-600 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-700 mb-2">
                {siteSettings?.statistics?.totalStudents || 500}+
              </div>
              <div className="text-gray-600 font-medium">
                {t('statistics.students')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-700 mb-2">
                {siteSettings?.statistics?.teacherCount || 25}+
              </div>
              <div className="text-gray-600 font-medium">
                {t('statistics.teachers')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-700 mb-2">
                {siteSettings?.statistics?.yearsOfService || 15}+
              </div>
              <div className="text-gray-600 font-medium">
                {t('statistics.years')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-700 mb-2">
                {siteSettings?.statistics?.graduationRate || 95}%
              </div>
              <div className="text-gray-600 font-medium">
                {t('statistics.successRate')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO and Accessibility improvements */}
      <div className="sr-only">
        <h1>Madrasatul Quran - Islamic Education Excellence</h1>
        <p>
          Combining traditional Islamic values with modern education in Dhaka,
          Bangladesh
        </p>
      </div>
    </section>
  );
}
