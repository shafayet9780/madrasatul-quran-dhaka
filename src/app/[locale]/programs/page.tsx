import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/lib/i18n';
import { sanityFetch } from '@/lib/sanity-fetch';
import { allAcademicProgramsQuery } from '@/lib/sanity-queries';
import { type AcademicProgram } from '@/types/sanity';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50">
      <PageHero
        language={locale === 'bengali' ? 'bengali' : 'english'}
        icon={<GraduationCap className="h-7 w-7 text-white" />}
        title={locale === 'bengali' ? 'একাডেমিক প্রোগ্রাম' : 'Academic Programs'}
        subtitle={
          locale === 'bengali'
            ? 'ইসলামী শিক্ষা ও আধুনিক পাঠ্যক্রমের সমন্বয়ে সামগ্রিক শিক্ষা'
            : 'Comprehensive Education Combining Islamic Studies and Modern Curriculum'
        }
        chips={[
          { icon: <BookOpen className="h-4 w-4" />, label: locale === 'bengali' ? 'ইসলামী শিক্ষা' : 'Islamic Studies' },
          { icon: <GraduationCap className="h-4 w-4" />, label: locale === 'bengali' ? 'এনসিটিবি পাঠ্যক্রম' : 'NCTB Curriculum' },
          { icon: <Users className="h-4 w-4" />, label: locale === 'bengali' ? 'সহ-পাঠক্রমিক' : 'Co-curricular' },
        ]}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
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