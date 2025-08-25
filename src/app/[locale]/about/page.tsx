import { Metadata } from 'next';
import ComingSoonPage from '@/components/ui/coming-soon-page';
// Temporarily replaced with coming soon page for MVP launch
// Original imports commented out:
// import { notFound } from 'next/navigation';
// import { draftMode } from 'next/headers';
// import { getTranslations } from 'next-intl/server';
// import {
//   SchoolHistoryVision,
//   LeadershipTeam,
//   EducationalPhilosophy,
// } from '@/components/about';
// import { getContentService } from '@/lib/content-service';
// import { getPreviewContext } from '@/lib/preview';
// import { PreviewBanner } from '@/components/preview/preview-banner';
// import type { StaffMember, Page } from '@/types/sanity';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About Us - Madrasatul Quran',
    description: 'Learn about our institution, mission, and educational philosophy.',
  };
}

export default function AboutPage() {
  return (
    <ComingSoonPage 
      pageTitle="About Us" 
      expectedLaunch="Coming Soon" 
    />
  );
}
