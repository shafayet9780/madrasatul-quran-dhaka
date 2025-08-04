import { useTranslations } from 'next-intl';
import { HeroSection } from '@/components/homepage';
import MissionStatisticsSection from '@/components/homepage/mission-statistics-section';
import FeaturedContentSection from '@/components/homepage/featured-content-section';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Mission Statement and Statistics Section */}
      <MissionStatisticsSection />

      {/* Featured Content and Quick Access Section */}
      <FeaturedContentSection />
    </>
  );
}
