'use client';

import { useTranslations } from 'next-intl';
import { HeroImage } from '@/components/ui/optimized-image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SplitText } from '@/components/ui';
import ProspectusDownload from '@/components/ui/prospectus-download';

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
  const locale = useLocale() as 'bengali' | 'english';
  const [isVisible, setIsVisible] = useState(false);

  // Animation on mount for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Activity images for the gallery
  const sanityImages =
    siteSettings?.heroImages && siteSettings.heroImages.length > 0
      ? siteSettings.heroImages
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(heroImage => ({
            image: heroImage.image, // Pass the Sanity image object directly
            alt: heroImage.alt,
            title:
              getLocalizedText(heroImage.title, locale) || 'Activity Image',
          }))
      : null;

  const fallbackImages = [
    {
      image: '/images/activities/classroom-learning.jpg',
      alt: 'Students in classroom learning session',
      title: 'Interactive Learning',
    },
    {
      image: '/images/activities/quran-recitation.jpg',
      alt: 'Students reciting Quran',
      title: 'Quran Recitation',
    },
    {
      image: '/images/activities/science-lab.jpg',
      alt: 'Students in science laboratory',
      title: 'Science Laboratory',
    },
    {
      image: '/images/activities/sports-activities.jpg',
      alt: 'Students participating in sports',
      title: 'Sports & Recreation',
    },
    {
      image: '/images/activities/cultural-program.jpg',
      alt: 'Cultural program performance',
      title: 'Cultural Programs',
    },
  ];

  // Use Sanity images if available (even if just 1), otherwise use fallback
  const activityImages =
    sanityImages && sanityImages.length > 0 ? sanityImages : fallbackImages;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate activity images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % activityImages.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [activityImages.length]);

  return (
    <section
      className={`relative w-full overflow-hidden h-[55vh] sm:h-[85vh] min-h-[380px] sm:min-h-[600px] bg-primary-900 ${className}`}
    >
      {/* Full-bleed image slides */}
      {activityImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <HeroImage
            image={image.image}
            alt={image.alt}
            fill
            className="object-cover"
            onError={() => {
              // Image failed to load
            }}
          />
        </div>
      ))}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/50 via-primary-900/20 to-primary-900/75" />

      {/* Content overlay */}
      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-4 sm:px-6 text-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Bismillah badge */}
        <div
          className="inline-flex items-center rounded-full px-5 py-2 text-white bg-white/20 border border-white/30 backdrop-blur-sm mb-5"
          aria-label="Bismillah"
        >
          <span className="font-arabic text-2xl sm:text-3xl leading-none">
            ﷽
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-white drop-shadow-lg max-w-4xl">
          <SplitText mode="words" stagger={0.06}>
            {siteSettings
              ? getLocalizedText(siteSettings.title, locale)
              : t('hero.title')}
          </SplitText>
        </h1>

        {/* Subtitle */}
        <h2 className="mt-3 text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl drop-shadow">
          {siteSettings
            ? getLocalizedText(siteSettings.description, locale)
            : t('hero.subtitle')}
        </h2>

        {/* CTA Buttons — glassmorphism, always side by side */}
        <div className="mt-6 sm:mt-8 flex flex-row gap-3 items-center">
          <Link
            href="/contact"
            className="group bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm sm:text-base shadow-lg hover:scale-105"
          >
            <span className="whitespace-nowrap">{tNav('contact')}</span>
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300"
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

          {/* Prospectus Download Button */}
          <ProspectusDownload
            locale={locale}
            variant="outline"
            size="sm"
            className="whitespace-nowrap !bg-white/20 hover:!bg-white/30 !border-white/40 !text-white backdrop-blur-sm sm:!px-6 sm:!py-3 sm:!text-base"
          />
        </div>
      </div>

      {/* Gallery indicator dots — above wave */}
      <div className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
        {activityImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            aria-label={`Go to image ${index + 1}`}
            className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? 'bg-white w-6 sm:w-8'
                : 'bg-white/50 w-2 sm:w-3'
            }`}
          />
        ))}
      </div>

      {/* SEO and Accessibility improvements */}
      <div className="sr-only">
        <h1>Madrasatul Quran - Excellence in Islamic Education</h1>
        <p>An ideal combination of islamic and general education</p>
      </div>
    </section>
  );
}
