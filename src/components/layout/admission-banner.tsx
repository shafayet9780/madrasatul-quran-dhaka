'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { X, ArrowRight } from 'lucide-react';
import type { AdmissionBanner as AdmissionBannerType } from '@/types/sanity';
import type { Language } from '@/types';
import { getLocalizedText } from '@/lib/multilingual-content';

interface AdmissionBannerProps {
  bannerConfig?: AdmissionBannerType | null;
}

export default function AdmissionBanner({ bannerConfig }: AdmissionBannerProps) {
  const locale = useLocale() as Language;
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fallback configuration if CMS data is not available
  const defaultConfig: AdmissionBannerType = {
    isEnabled: true,
    title: {
      bengali: '২০২৬ শিক্ষাবর্ষে ভর্তি চলছে',
      english: 'Admissions Open for 2026 Academic Year'
    },
    subtitle: {
      bengali: 'আজই আবেদন করুন',
      english: 'Apply Now'
    },
    buttonText: {
      bengali: 'আবেদন করুন',
      english: 'Apply Now'
    },
    buttonLink: '/pre-admission', // Link to pre-admission form page
    backgroundColor: 'primary', // Forest Green - attention-grabbing
    showCloseButton: true,
    autoHide: 0
  };

  // Use CMS config if available, otherwise use default
  const config = bannerConfig || defaultConfig;

  // NOTE: Do not return before hooks; gate later by visibility

  const handleClose = () => {
    if (!config.showCloseButton) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  // Auto-hide functionality from CMS
  useEffect(() => {
    if (config.autoHide > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, config.autoHide * 1000);

      return () => clearTimeout(timer);
    }
  }, [config.autoHide, handleClose]);


  // Gate rendering after hooks
  if (!config.isEnabled || !isVisible) return null;

  // Get localized content
  const title = getLocalizedText(config.title, locale);
  const subtitle = config.subtitle ? getLocalizedText(config.subtitle, locale) : '';
  const buttonText = getLocalizedText(config.buttonText, locale);

  // Get background style based on CMS configuration
  const getBackgroundStyle = () => {
    switch (config.backgroundColor) {
      case 'primary':
        return {
          background: 'linear-gradient(90deg, #2D5A27 0%, #4A7C59 50%, #6B8E23 100%)',
        };
      case 'secondary':
        return {
          background: 'linear-gradient(90deg, #8B4513 0%, #CD853F 50%, #DAA520 100%)',
        };
      case 'accent':
        return {
          background: 'linear-gradient(90deg, #B22222 0%, #DC143C 50%, #FF6347 100%)',
        };
      case 'custom':
        return {
          background: `linear-gradient(90deg, ${config.customGradient?.from || '#2D5A27'} 0%, ${config.customGradient?.to || '#6B8E23'} 100%)`,
        };
      default:
        return {
          background: 'linear-gradient(90deg, #2D5A27 0%, #4A7C59 50%, #6B8E23 100%)',
        };
    }
  };

  return (
    <div
      className="admission-banner overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 container-custom">
        <div className="flex items-center justify-center py-2 md:py-3 relative">
          {/* Close button - Far right */}
          {config.showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 p-1.5 md:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0 z-10"
              aria-label="Close banner"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </button>
          )}

          {/* Centered content */}
          <div className="flex items-center justify-center space-x-4 md:space-x-6 lg:space-x-8">
            {/* Decorative element */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            </div>

            {/* Main text */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-center md:text-left">
              <h2 className="text-white font-bengali font-bold text-sm md:text-base lg:text-lg xl:text-xl leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-white/90 font-bengali font-medium text-xs md:text-sm lg:text-base">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Call-to-action button */}
            <a
              href={config.buttonLink}
              className="inline-flex items-center space-x-2 bg-white/30 hover:bg-white/40 text-white font-bengali font-semibold px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-white/50 text-sm md:text-base lg:text-lg whitespace-nowrap"
            >
              <span>{buttonText}</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </a>

            {/* Right decorative element */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
