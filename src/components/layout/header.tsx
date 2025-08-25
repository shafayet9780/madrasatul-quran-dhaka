'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Menu, X, Phone } from 'lucide-react';
import LanguageToggle from '@/components/language-toggle';
import { type Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { getLocalizedText } from '@/lib/multilingual-content';

interface HeaderProps {
  siteSettings?: SiteSettings | null;
}

export default function Header({ siteSettings }: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get site title from settings or fallback
  const siteTitle = siteSettings?.title 
    ? getLocalizedText(siteSettings.title, locale)
    : (locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran');

  const siteSubtitle = locale === 'bengali' 
    ? 'ইসলামী শিক্ষায় উৎকর্ষতা' 
    : 'Excellence in Islamic Education';

  // Get logo URL from settings
  const logoUrl = siteSettings?.logo 
    ? `/api/image/${siteSettings.logo.asset._ref}?w=80&h=80`
    : null;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileMenuOpen]);

  // Navigation items for MVP - only Home and Contact
  const navigationItems = [
    { key: 'home', href: '/' },
    // Temporarily hidden for MVP launch - uncomment when ready to launch full site
    // { key: 'about', href: '/about' },
    // { key: 'programs', href: '/programs', hasDropdown: true },
    // { key: 'admissions', href: '/admissions' },
    // { key: 'campus', href: '/campus' },
    // { key: 'news', href: '/news' },
    { key: 'contact', href: '/contact' },
  ];

  const MobileMenuContent = () => (
    <>
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[9998] xl:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'opacity-100' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: isMobileMenuOpen 
            ? 'linear-gradient(135deg, rgba(184, 146, 79, 0.4) 0%, rgba(125, 98, 53, 0.6) 100%)'
            : 'transparent'
        }}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[9999] transform transition-all duration-300 ease-in-out xl:hidden backdrop-blur-md ${
          isMobileMenuOpen 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
        style={{
          transformOrigin: 'right center'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-sand-medium bg-sand-light">
            <div className="flex flex-col items-start">
              <div className="text-lg md:text-xl font-bold text-primary-700 font-arabic">
                ﷽
              </div>
              <div className="text-base md:text-lg font-bold text-primary-700 font-bengali">
                মাদরাসাতুল কুরআন
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-primary-700 hover:text-primary-800 hover:bg-sand-light transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label={tCommon('close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 md:py-6">
            <div className="space-y-2 px-4 md:px-6">
              {navigationItems.map(item => (
                <div key={item.key}>
                  {/* Temporarily all items are simple links for MVP */}
                  <Link
                    href={item.href}
                    className="block py-3 text-gray-700 hover:text-primary-700 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.key as keyof typeof t)}
                  </Link>
                </div>
              ))}
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="border-t border-gray-200 p-4 md:p-6">
            {/* Language Toggle for Mobile */}
            <div className="sm:hidden mb-4">
              <LanguageToggle />
            </div>
            
            <a
              href="tel:+8801234567890"
              className="flex items-center space-x-3 text-primary-700 hover:text-primary-800 transition-colors mb-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">
                {siteSettings?.contactInfo?.phone?.find(p => p.isPrimary)?.number || 
                 siteSettings?.contactInfo?.phone?.[0]?.number || 
                 (locale === 'bengali' ? '+৮৮০ ১২৩৪ ৫৬৭৮৯০' : '+880 1234 567890')}
              </span>
            </a>
            <div className="text-sm text-gray-600">
              {siteSettings?.description 
                ? getLocalizedText(siteSettings.description, locale)
                : (locale === 'bengali'
                  ? 'ইসলামী শিক্ষায় উৎকর্ষতা'
                  : 'Excellence in Islamic Education')}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="bg-white shadow-xl border-b-2 border-sand-medium sticky top-0 z-40 backdrop-blur-md bg-opacity-98">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Compact Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={siteSettings?.logo?.alt || 'Institution Logo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-primary-700">🏛️</span>
                )}
              </div>
              <div className="flex flex-col">
                <div className="text-base md:text-lg font-bold text-primary-700 leading-tight">
                  {siteTitle}
                </div>
                <div className="text-xs text-primary-600 hidden md:block">
                  {siteSubtitle}
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center justify-center flex-1 max-w-4xl mx-8">
              <div className="flex items-center space-x-4">
                {navigationItems.map(item => (
                  <div key={item.key} className="relative">
                    {/* All items are simple links for MVP */}
                    <Link href={item.href} className="nav-link">
                      {t(item.key as keyof typeof t)}
                    </Link>
                  </div>
                ))}
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {/* Contact Button - Hidden on mobile */}
              <a
                href={`tel:${siteSettings?.contactInfo?.phone?.find(p => p.isPrimary)?.number || 
                           siteSettings?.contactInfo?.phone?.[0]?.number || 
                           '+8801234567890'}`}
                className="hidden xl:flex items-center space-x-2 px-3 py-2 rounded-full bg-accent-600 text-white hover:bg-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-sm whitespace-nowrap"
                aria-label="Call us"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {locale === 'bengali' ? 'কল করুন' : 'Call Us'}
                </span>
              </a>

              {/* Language Toggle */}
              <div className="hidden sm:block">
                <LanguageToggle />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2 md:p-3 rounded-xl bg-sand-light text-primary-700 hover:text-primary-800 hover:bg-sand-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                aria-label={isMobileMenuOpen ? tCommon('close') : tCommon('menu')}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Menu className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Portal - Rendered at document body level */}
      {mounted && isMobileMenuOpen && createPortal(<MobileMenuContent />, document.body)}
    </>
  );
}