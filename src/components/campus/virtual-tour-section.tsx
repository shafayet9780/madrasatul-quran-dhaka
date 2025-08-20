'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn, Camera, MapPin } from 'lucide-react';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: 'academic' | 'islamic' | 'recreational' | 'administrative';
  description?: string;
}

// Fallback data for campus images when Sanity data is not available
const fallbackCampusImages: GalleryImage[] = [
  {
    id: '1',
    src: '/images/campus/classroom-1.jpg',
    alt: 'Modern classroom with smart board',
    title: 'Smart Classroom',
    category: 'academic',
    description: 'State-of-the-art classroom equipped with interactive smart boards and modern furniture'
  },
  {
    id: '2',
    src: '/images/campus/prayer-hall.jpg',
    alt: 'Beautiful prayer hall with Islamic architecture',
    title: 'Main Prayer Hall',
    category: 'islamic',
    description: 'Spacious prayer hall accommodating 500+ students with beautiful Islamic architecture'
  },
  {
    id: '3',
    src: '/images/campus/library.jpg',
    alt: 'Well-stocked library with reading areas',
    title: 'Central Library',
    category: 'academic',
    description: 'Comprehensive library with over 10,000 books in Bengali, English, and Arabic'
  },
  {
    id: '4',
    src: '/images/campus/science-lab.jpg',
    alt: 'Modern science laboratory',
    title: 'Science Laboratory',
    category: 'academic',
    description: 'Fully equipped physics, chemistry, and biology laboratories for hands-on learning'
  },
  {
    id: '5',
    src: '/images/campus/quran-room.jpg',
    alt: 'Quran memorization room',
    title: 'Quran Memorization Room',
    category: 'islamic',
    description: 'Peaceful environment designed specifically for Quran memorization and recitation'
  },
  {
    id: '6',
    src: '/images/campus/playground.jpg',
    alt: 'Sports playground and facilities',
    title: 'Sports Ground',
    category: 'recreational',
    description: 'Large playground for cricket, football, and other outdoor activities'
  },
  {
    id: '7',
    src: '/images/campus/computer-lab.jpg',
    alt: 'Computer laboratory with modern PCs',
    title: 'Computer Lab',
    category: 'academic',
    description: 'Modern computer laboratory with high-speed internet and latest software'
  },
  {
    id: '8',
    src: '/images/campus/admin-office.jpg',
    alt: 'Administrative office building',
    title: 'Administrative Office',
    category: 'administrative',
    description: 'Main administrative building housing principal office and staff rooms'
  }
];

import type { Facility } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';
import { useLocale } from 'next-intl';

interface VirtualTourSectionProps {
  facilities?: Facility[];
}

export default function VirtualTourSection({ facilities = [] }: VirtualTourSectionProps) {
  const t = useTranslations('campus.virtualTour');
  const locale = useLocale() as 'bengali' | 'english';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Convert Sanity facilities to gallery images
  const sanityImages: GalleryImage[] = facilities.map((facility) => ({
    id: facility._id,
    src: facility.images?.[0] ? `/api/image/${facility.images[0].asset._ref}?w=800&h=600` : '/images/campus/default-facility.jpg',
    alt: facility.images?.[0]?.alt || getLocalizedText(facility.name, locale),
    title: getLocalizedText(facility.name, locale),
    category: facility.category as any,
    description: getLocalizedText(facility.description, locale) || ''
  }));

  // Use Sanity data if available, otherwise fallback
  const campusImages = sanityImages.length > 0 ? sanityImages : fallbackCampusImages;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    { key: 'all', label: t('categories.all') },
    { key: 'academic', label: t('categories.academic') },
    { key: 'islamic', label: t('categories.islamic') },
    { key: 'recreational', label: t('categories.recreational') },
    { key: 'administrative', label: t('categories.administrative') }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? campusImages 
    : campusImages.filter(img => img.category === selectedCategory);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    if (mounted) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    if (mounted) {
      document.body.style.overflow = '';
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === filteredImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mounted) {
        document.body.style.overflow = '';
      }
    };
  }, [mounted]);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-white via-sand-light to-primary-50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 text-primary-600 mr-3" />
            <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
              Virtual Tour
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            {t('subtitle')}
          </p>
          <p className="text-base text-text-secondary max-w-4xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.key
                  ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-text-secondary hover:bg-primary-50 hover:text-primary-700 shadow-md hover:shadow-lg'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Image Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-2"
              onClick={() => openLightbox(index)}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <ZoomIn className="w-5 h-5 text-primary-600" />
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    image.category === 'academic' ? 'bg-blue-100 text-blue-700' :
                    image.category === 'islamic' ? 'bg-green-100 text-green-700' :
                    image.category === 'recreational' ? 'bg-orange-100 text-orange-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {categories.find(c => c.key === image.category)?.label}
                  </span>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4">
                <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary-700 transition-colors">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <MapPin className="w-5 h-5 mr-2" />
            {t('startTour')}
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && mounted && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          <button
            onClick={prevImage}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image Container */}
          <div className="relative max-w-7xl max-h-[90vh] mx-auto px-16">
            <Image
              src={filteredImages[currentImageIndex]?.src || ''}
              alt={filteredImages[currentImageIndex]?.alt || ''}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
              priority
            />
            
            {/* Image Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">
                {filteredImages[currentImageIndex]?.title}
              </h3>
              {filteredImages[currentImageIndex]?.description && (
                <p className="text-white/90">
                  {filteredImages[currentImageIndex].description}
                </p>
              )}
              <div className="mt-3 text-sm text-white/70">
                {currentImageIndex + 1} of {filteredImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}