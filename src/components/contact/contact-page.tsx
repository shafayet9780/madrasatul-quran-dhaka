'use client';

import { useTranslations } from 'next-intl';
import ContactInfoDisplay from './contact-info-display';
import LocationMaps from './location-maps';
import type { SiteSettings } from '@/types/sanity';

interface ContactPageProps {
  siteSettings?: SiteSettings | null;
}

export default function ContactPage({ siteSettings }: ContactPageProps) {
  const t = useTranslations('contact');

  console.log(siteSettings);

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary-200 to-primary-300 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Information Display */}
      <ContactInfoDisplay siteSettings={siteSettings} />

      {/* Location and Maps */}
      <LocationMaps siteSettings={siteSettings} />

      {/* Contact Forms - Temporarily commented out */}
      {/* <ContactForms /> */}
    </div>
  );
}