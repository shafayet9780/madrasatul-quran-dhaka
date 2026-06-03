import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ComingSoonPage from '@/components/ui/coming-soon-page';
// Temporarily replaced with coming soon page for MVP launch
// Original imports commented out:
// import { notFound } from 'next/navigation';
// import { draftMode } from 'next/headers';
// import {
//   SchoolHistoryVision,
//   LeadershipTeam,
//   EducationalPhilosophy,
// } from '@/components/about';
// import { getContentService } from '@/lib/content-service';
// import { getPreviewContext } from '@/lib/preview';
// import { PreviewBanner } from '@/components/preview/preview-banner';
// import type { Page } from '@/types/sanity';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about.meta' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  
  return (
    <ComingSoonPage 
      pageTitle={(locale === 'bn' || locale === 'bengali') ? 'আমাদের সম্পর্কে' : 'About Us'} 
      expectedLaunch="Coming Soon"
      locale={locale}
    />
  );
}
