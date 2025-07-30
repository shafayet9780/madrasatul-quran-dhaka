'use client';

import { useTranslations } from 'next-intl';
import LanguageToggle from '@/components/language-toggle';

export default function Header() {
  const t = useTranslations('navigation');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-700 font-bengali">
              মাদরাসাতুল কুরআন
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('home')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('about')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('programs')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('admissions')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('campus')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('news')}
            </a>
            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
              {t('contact')}
            </a>
          </nav>

          {/* Language Toggle */}
          <div className="flex items-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}