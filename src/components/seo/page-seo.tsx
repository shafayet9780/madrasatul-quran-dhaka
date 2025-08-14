'use client';

import Head from 'next/head';
import { useLocale, usePathname } from 'next-intl';
import { generateLocalSEOTags, generateHreflangTags } from '@/lib/local-seo';

interface PageSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

export function PageSEO({
  title,
  description,
  keywords = [],
  image,
  noindex = false,
  nofollow = false,
  canonical,
}: PageSEOProps) {
  const locale = useLocale() as 'bengali' | 'english';
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://madrasatul-quran.edu.bd';
  
  const localSEOTags = generateLocalSEOTags(locale);
  const hreflangTags = generateHreflangTags(pathname);
  
  const fullTitle = `${title} | ${locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'}`;
  const canonicalUrl = canonical || `${baseUrl}${pathname}`;
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/images/og-image.jpg`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Robots */}
      <meta
        name="robots"
        content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`}
      />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang Tags */}
      {Object.entries(hreflangTags).map(([key, url]) => (
        <link
          key={key}
          rel="alternate"
          hrefLang={key.replace('hreflang-', '')}
          href={url}
        />
      ))}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={locale === 'bengali' ? 'bn_BD' : 'en_US'} />
      <meta property="og:locale:alternate" content={locale === 'bengali' ? 'en_US' : 'bn_BD'} />
      <meta property="og:site_name" content={locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@madrasatul_quran" />
      <meta name="twitter:creator" content="@madrasatul_quran" />
      
      {/* Local SEO Tags */}
      {Object.entries(localSEOTags).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
      
      {/* Additional Meta Tags */}
      <meta name="author" content={locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'} />
      <meta name="publisher" content={locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'}`} />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="format-detection" content="address=yes" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#b8924f" />
      <meta name="msapplication-TileColor" content="#b8924f" />
      
      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cdn.sanity.io" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  );
}

// Preset components for common pages
export function HomepageSEO() {
  const locale = useLocale() as 'bengali' | 'english';
  
  return (
    <PageSEO
      title={locale === 'bengali' ? 'ইসলামী শিক্ষায় উৎকর্ষতা' : 'Excellence in Islamic Education'}
      description={
        locale === 'bengali'
          ? 'ঢাকার একটি প্রতিষ্ঠিত ইসলামী শিক্ষা প্রতিষ্ঠান যা ঐতিহ্যবাহী ইসলামী শিক্ষার সাথে আধুনিক শিক্ষার সমন্বয় করে সামগ্রিক উন্নয়নের জন্য।'
          : 'A leading Islamic educational institution in Dhaka combining traditional Islamic values with contemporary education for holistic development.'
      }
      keywords={
        locale === 'bengali'
          ? ['ইসলামী শিক্ষা', 'মাদরাসা', 'কুরআন', 'হাদিস', 'ঢাকা', 'বাংলাদেশ']
          : ['Islamic education', 'Madrasah', 'Quran', 'Hadith', 'Dhaka', 'Bangladesh']
      }
      image="/images/homepage-hero.jpg"
    />
  );
}

export function AboutSEO() {
  const locale = useLocale() as 'bengali' | 'english';
  
  return (
    <PageSEO
      title={locale === 'bengali' ? 'আমাদের সম্পর্কে' : 'About Us'}
      description={
        locale === 'bengali'
          ? 'মাদরাসাতুল কুরআনের ইতিহাস, দর্শন এবং নেতৃত্ব সম্পর্কে জানুন। আমাদের শিক্ষা পদ্ধতি এবং মূল্যবোধ সম্পর্কে বিস্তারিত তথ্য।'
          : 'Learn about Madrasatul Quran\'s history, philosophy, and leadership. Detailed information about our educational approach and values.'
      }
      keywords={
        locale === 'bengali'
          ? ['স্কুলের ইতিহাস', 'শিক্ষা দর্শন', 'নেতৃত্ব', 'ইসলামী মূল্যবোধ']
          : ['school history', 'educational philosophy', 'leadership', 'Islamic values']
      }
      image="/images/about-us.jpg"
    />
  );
}

export function ProgramsSEO() {
  const locale = useLocale() as 'bengali' | 'english';
  
  return (
    <PageSEO
      title={locale === 'bengali' ? 'শিক্ষা কার্যক্রম' : 'Academic Programs'}
      description={
        locale === 'bengali'
          ? 'আমাদের ইসলামী শিক্ষা এবং এনসিটিবি পাঠ্যক্রমের বিস্তারিত তথ্য। কুরআন মুখস্থকরণ, হাদিস, ফিকহ এবং আধুনিক বিষয়সমূহ।'
          : 'Comprehensive information about our Islamic studies and NCTB curriculum. Quran memorization, Hadith, Fiqh, and modern subjects.'
      }
      keywords={
        locale === 'bengali'
          ? ['কুরআন মুখস্থকরণ', 'ইসলামী শিক্ষা', 'এনসিটিবি পাঠ্যক্রম', 'হাদিস', 'ফিকহ']
          : ['Quran memorization', 'Islamic studies', 'NCTB curriculum', 'Hadith', 'Fiqh']
      }
      image="/images/academic-programs.jpg"
    />
  );
}