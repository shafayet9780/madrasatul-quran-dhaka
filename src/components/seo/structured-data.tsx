'use client';

import { useLocale } from 'next-intl';
import Script from 'next/script';
import { 
  generateEducationalInstitutionStructuredData,
  generateLocalBusinessStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData 
} from '@/lib/seo';
import { generateLocalBusinessStructuredData as generateLocalSEOData } from '@/lib/local-seo';

interface StructuredDataProps {
  type: 'organization' | 'local-business' | 'breadcrumb' | 'faq' | 'article';
  data?: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const locale = useLocale() as 'bengali' | 'english';

  const getStructuredData = () => {
    switch (type) {
      case 'organization':
        return generateEducationalInstitutionStructuredData(locale);
      
      case 'local-business':
        return generateLocalSEOData(locale);
      
      case 'breadcrumb':
        return generateBreadcrumbStructuredData(data.breadcrumbs, locale);
      
      case 'faq':
        return generateFAQStructuredData(data.faqs, locale);
      
      case 'article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title,
          description: data.description,
          image: data.image,
          author: {
            '@type': 'Organization',
            name: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
          },
          publisher: {
            '@type': 'Organization',
            name: locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran',
            logo: {
              '@type': 'ImageObject',
              url: '/images/logo.png',
            },
          },
          datePublished: data.publishedAt,
          dateModified: data.modifiedAt || data.publishedAt,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': data.url,
          },
        };
      
      default:
        return null;
    }
  };

  const structuredData = getStructuredData();

  if (!structuredData) {
    return null;
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}

// Preset components for common use cases
export function OrganizationStructuredData() {
  return <StructuredData type="organization" />;
}

export function LocalBusinessStructuredData() {
  return <StructuredData type="local-business" />;
}

export function BreadcrumbStructuredData({ breadcrumbs }: { breadcrumbs: Array<{ name: string; url: string }> }) {
  return <StructuredData type="breadcrumb" data={{ breadcrumbs }} />;
}

export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return <StructuredData type="faq" data={{ faqs }} />;
}

export function ArticleStructuredData({
  title,
  description,
  image,
  publishedAt,
  modifiedAt,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  modifiedAt?: string;
  url: string;
}) {
  return (
    <StructuredData
      type="article"
      data={{
        title,
        description,
        image,
        publishedAt,
        modifiedAt,
        url,
      }}
    />
  );
}