import type { Metadata } from 'next';
import type { Locale } from './i18n';
import { getSiteUrl } from './site-url';

export const SOCIAL_IMAGE = '/images/social/school.jpg';

export function generatePageMetadata({
  title,
  description,
  locale,
  path = '',
}: {
  title: string;
  description: string;
  locale: Locale;
  path?: string;
}): Metadata {
  const origin = getSiteUrl();
  const url = `${origin}/${locale}${path}`;
  const image = `${origin}${SOCIAL_IMAGE}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: {
        'bn-BD': `${origin}/bengali${path}`,
        en: `${origin}/english${path}`,
        'x-default': `${origin}/bengali${path}`,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
      locale: locale === 'bengali' ? 'bn_BD' : 'en_US',
      alternateLocale: [locale === 'bengali' ? 'en_US' : 'bn_BD'],
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt:
            locale === 'bengali'
              ? 'মাদরাসাতুল কুরআনের ভবন'
              : 'Madrasatul Quran school building',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
