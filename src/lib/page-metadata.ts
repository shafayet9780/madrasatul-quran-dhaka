import type { Metadata } from 'next';
import type { Locale } from './i18n';
import { getSiteUrl } from './site-url';

export const SOCIAL_IMAGE = '/images/social/school.jpg';
/** The site's default description, until Studio → Search & sharing has one. */
export const SITE_DESCRIPTION =
  'At Madrasatul Quran in Uttara, Dhaka, Islamic and general education are given equal weight in one ten-year plan. Day-care hifz with general study alongside. Nursery to Class 11.';

export function generatePageMetadata({
  title,
  description,
  locale,
  path = '',
  share,
  withSiteName = false,
}: {
  title: string;
  description: string;
  locale: Locale;
  path?: string;
  /** The picture link previews show (an album's cover); the school building when there is none. */
  share?: { url: string; alt: string };
  /** Add the school's name after the title (the layout's template); otherwise the title stands alone. */
  withSiteName?: boolean;
}): Metadata {
  const origin = getSiteUrl();
  const url = `${origin}/${locale}${path}`;
  const image = share?.url ?? `${origin}${SOCIAL_IMAGE}`;
  return {
    title: withSiteName ? title : { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: {
        'bn-BD': `${origin}/bengali${path}`,
        // Most people in Bangladesh use Google in English: en-BD sends them to the Bengali page, English stays for elsewhere.
        'en-BD': `${origin}/bengali${path}`,
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
            share?.alt ??
            (locale === 'bengali'
              ? 'মাদরাসাতুল কুরআনের ভবন'
              : 'Madrasatul Quran school building'),
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
