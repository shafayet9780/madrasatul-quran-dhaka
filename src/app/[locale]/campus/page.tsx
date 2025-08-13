import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import VirtualTourSection from '@/components/campus/virtual-tour-section';
import FacilitiesShowcase from '@/components/campus/facilities-showcase';
import SafetySecuritySection from '@/components/campus/safety-security-section';

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

export default function CampusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sand-light via-white to-sand-light">
      {/* Virtual Campus Tour Section */}
      <VirtualTourSection />
      
      {/* Facilities Showcase Section */}
      <FacilitiesShowcase />
      
      {/* Safety and Security Section */}
      <SafetySecuritySection />
    </main>
  );
}