import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { HeroSection } from '@/components/homepage';
import MissionStatisticsSection from '@/components/homepage/mission-statistics-section';
import FeaturedContentSection from '@/components/homepage/featured-content-section';
import { getContentService } from '@/lib/content-service';
import { getPreviewContext } from '@/lib/preview';
import { PreviewBanner } from '@/components/preview/preview-banner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function Home() {
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  const previewContext = await getPreviewContext();

  // Fetch dynamic content
  const [siteSettings, featuredNews, featuredFacilities] = await Promise.all([
    contentService.getSiteSettings(),
    contentService.getFeaturedNewsEvents(3),
    contentService.getFeaturedFacilities(),
  ]);

  return (
    <>
      {previewContext.isPreview && <PreviewBanner exitUrl={previewContext.exitUrl} />}
      
      {/* Hero Section */}
      <HeroSection 
        siteSettings={siteSettings}
        featuredNews={featuredNews}
      />

      {/* Mission Statement and Statistics Section */}
      <MissionStatisticsSection 
        siteSettings={siteSettings}
      />

      {/* Featured Content and Quick Access Section */}
      <FeaturedContentSection 
        featuredNews={featuredNews}
        featuredFacilities={featuredFacilities}
      />
    </>
  );
}
