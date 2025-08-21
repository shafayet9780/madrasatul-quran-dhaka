import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/lib/i18n';
import { sanityFetch } from '@/lib/sanity-fetch';
import { allAcademicProgramsQuery } from '@/lib/sanity-queries';
import { type AcademicProgram } from '@/types/sanity';
import IslamicStudiesSection from '@/components/programs/islamic-studies-section';
import NCTBCurriculumSection from '@/components/programs/nctb-curriculum-section';
import CoCurricularSection from '@/components/programs/co-curricular-section';

interface ProgramsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: ProgramsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'programs.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { locale } = await params;
  const programs = await sanityFetch<AcademicProgram[]>({
    query: allAcademicProgramsQuery,
    tags: ['academicProgram'],
    revalidate: process.env.NODE_ENV === 'development' ? 0 : 60, // No cache in development
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-light via-white to-sand-light">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-primary-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('/images/islamic-pattern.svg')] opacity-10"></div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-arabic">
              একাডেমিক প্রোগ্রাম
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 leading-relaxed">
              {locale === 'bengali' 
                ? 'ইসলামী শিক্ষা ও আধুনিক পাঠ্যক্রমের সমন্বয়ে সামগ্রিক শিক্ষা'
                : 'Comprehensive Education Combining Islamic Studies and Modern Curriculum'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-custom py-16">
        {/* Islamic Studies Section */}
        <IslamicStudiesSection programs={programs} locale={locale} />

        {/* NCTB Curriculum Section */}
        <NCTBCurriculumSection programs={programs} locale={locale} />

        {/* Co-curricular Activities Section */}
        <CoCurricularSection programs={programs} locale={locale} />
      </div>
    </div>
  );
}