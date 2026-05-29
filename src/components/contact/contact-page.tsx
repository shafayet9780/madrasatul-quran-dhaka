'use client';

import { useTranslations, useLocale } from 'next-intl';
import ContactInfoDisplay from './contact-info-display';
import LocationMaps from './location-maps';
import { PageHero } from '@/components/ui/page-hero';
import type { Language } from '@/lib/sanity-utils';
import type { SiteSettings } from '@/types/sanity';

interface ContactPageProps {
  siteSettings?: SiteSettings | null;
}

export default function ContactPage({ siteSettings }: ContactPageProps) {
  const t = useTranslations('contact');
  const locale = useLocale() as Language;

  return (
    <div className="min-h-screen">
      <PageHero language={locale} title={t('title')} subtitle={t('subtitle')} />

      {/* Contact Information Display */}
      <ContactInfoDisplay siteSettings={siteSettings} />

      {/* Location and Maps */}
      <LocationMaps siteSettings={siteSettings} />

      {/* Contact Forms - Temporarily commented out */}
      {/* <ContactForms /> */}
    </div>
  );
}