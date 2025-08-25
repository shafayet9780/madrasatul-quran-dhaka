'use client';

import { useTranslations } from 'next-intl';
import ContactInfoDisplay from './contact-info-display';
import LocationMaps from './location-maps';
import ContactForms from './contact-forms';

interface ContactPageProps {
  siteSettings?: any; // We'll add proper typing later
}

export default function ContactPage({ siteSettings }: ContactPageProps) {
  const t = useTranslations('contact');

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Information Display */}
      <ContactInfoDisplay siteSettings={siteSettings} />

      {/* Location and Maps */}
      <LocationMaps />

      {/* Contact Forms */}
      <ContactForms />
    </div>
  );
}