import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generatePageMetadata } from '@/lib/page-metadata';
import { getPublishedIntake } from '@/lib/admissions/pages';
import { CurriculumHero } from '@/components/curriculum/curriculum-hero';
import { TeachingModel } from '@/components/curriculum/teaching-model';
import { Strands } from '@/components/curriculum/strands';
import { Goals } from '@/components/curriculum/goals';
import { StudyPlanTable } from '@/components/curriculum/study-plan-table';
import { HigherEducation } from '@/components/curriculum/higher-education';
import { CurriculumClose } from '@/components/curriculum/curriculum-close';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'curriculum.meta' });
  return generatePageMetadata({ title: t('title'), description: t('description'), locale, path: '/curriculum' });
}

/**
 * The curriculum, from the prospectus (the source of truth): the 50-50 model and its three stages, the four strands,
 * the ten-year goals, the class-by-class plan with each class's books (the detailed curriculum), and the ways on after
 * Dakhil. Fees are on the Admissions page; the close links there, with apply while the form is open.
 */
export default async function CurriculumPage({ params }: Props) {
  const { locale } = await params;
  const { intake } = await getPublishedIntake();
  return (
    <>
      <CurriculumHero locale={locale} />
      <TeachingModel locale={locale} />
      <Strands locale={locale} />
      <Goals locale={locale} />
      <StudyPlanTable locale={locale} />
      <HigherEducation locale={locale} />
      <CurriculumClose locale={locale} open={intake.state === 'open'} />
    </>
  );
}
