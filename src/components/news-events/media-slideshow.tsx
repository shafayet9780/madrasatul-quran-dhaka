'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { NewsEvent, SanityImage } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';

interface MediaSlideshowProps {
  events: NewsEvent[];
  autoPlay?: boolean;
  interval?: number;
}

interface SlideImage extends SanityImage {
  eventTitle: string;
  eventId: string;
  eventCategory: string;
}

export function MediaSlideshow({ events, autoPlay = true, interval = 5000 }: MediaSlideshowProps) {
  const t = useTranslations('news.slideshow');
  const locale = useLocale();
  const language = locale as 'bengali' | 'english';
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Flatten all gallery images from events
  const slides: SlideImage[] = events.flatMap(event =>
    (event.gallery || []).slice(0, 3).map(image => ({
      ...image,
      eventTitle: event.title[language],
      eventId: event._id,
      eventCategory: event.category,
    }))
  ).slice(0, 10); // Limit to 10 slides for performance

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, interval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (slides.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 text-lg">{t('noImages')}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Main Slide */}
      <div className="relative h-96 md:h-[500px]">
        <Image
          src={urlFor(slides[currentSlide]).width(800).height(500).url()}
          alt={slides[currentSlide].alt}
          fill
          className="object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Play/Pause Button */}
        {slides.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            )}
          </button>
        )}
        
        {/* Slide Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-white text-xl font-bold mb-2 font-bengali">
            {slides[currentSlide].eventTitle}
          </h3>
          {slides[currentSlide].caption?.[language] && (
            <p className="text-gray-300 text-sm font-bengali">
              {slides[currentSlide].caption[language]}
            </p>
          )}
        </div>
      </div>
      
      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Thumbnail Strip */}
      {slides.length > 1 && (
        <div className="bg-gray-900 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 relative w-16 h-12 rounded overflow-hidden transition-opacity ${
                  index === currentSlide ? 'opacity-100 ring-2 ring-white' : 'opacity-60 hover:opacity-80'
                }`}
              >
                <Image
                  src={urlFor(slide).width(64).height(48).url()}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}