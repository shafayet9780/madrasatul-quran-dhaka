import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import VirtualTourSection from '@/components/campus/virtual-tour-section';
import FacilitiesShowcase from '@/components/campus/facilities-showcase';
import SafetySecuritySection from '@/components/campus/safety-security-section';
import { getContentService } from '@/lib/content-service';
import { getPreviewContext } from '@/lib/preview';
import { PreviewBanner } from '@/components/preview/preview-banner';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'campus.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function CampusPage() {
  const draft = await draftMode();
  const isPreview = draft.isEnabled;
  const contentService = getContentService(isPreview);
  const previewContext = await getPreviewContext();

  // Fetch facilities data from Sanity
  const facilities = await contentService.getAllFacilities();

  return (
    <main className="min-h-screen bg-gradient-to-br from-sand-light via-white to-sand-light">
      {previewContext.isPreview && (
        <PreviewBanner exitUrl={previewContext.exitUrl} />
      )}

      {/* Virtual Campus Tour Section */}
      <VirtualTourSection facilities={facilities} />

      {/* Facilities Showcase Section */}
      <FacilitiesShowcase facilities={facilities} />

      {/* Safety and Security Section */}
      <SafetySecuritySection />
    </main>
  );
}
