import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import {
  SchoolHistoryVision,
  LeadershipTeam,
  EducationalPhilosophy,
} from '@/components/about';
import { getContentService } from '@/lib/content-service';
import { getPreviewContext } from '@/lib/preview';
import { PreviewBanner } from '@/components/preview/preview-banner';
import type { StaffMember, Page } from '@/types/sanity';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AboutPage() {
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  const previewContext = await getPreviewContext();

  try {
    // Fetch leadership team data
    const leaders = await contentService.getLeadershipTeam();

    // Fetch page content for history and philosophy (optional - can be managed through CMS)
    const [historyContent, visionContent, philosophyContent, siteSettings] = await Promise.all([
      contentService.getPageBySlug('school-history'),
      contentService.getPageBySlug('school-vision'),
      contentService.getPageBySlug('educational-philosophy'),
      contentService.getSiteSettings(),
    ]);

    return (
      <>
        {previewContext.isPreview && <PreviewBanner exitUrl={previewContext.exitUrl} />}
        
        {/* School History and Vision Section */}
        <SchoolHistoryVision
          historyContent={historyContent}
          visionContent={visionContent}
          siteSettings={siteSettings}
        />

        {/* Leadership Team Section */}
        <LeadershipTeam leaders={leaders} />

        {/* Educational Philosophy and Accreditation Section */}
        <EducationalPhilosophy 
          philosophyContent={philosophyContent}
          siteSettings={siteSettings}
        />
      </>
    );
  } catch (error) {
    console.error('Error loading about page:', error);
    notFound();
  }
}
