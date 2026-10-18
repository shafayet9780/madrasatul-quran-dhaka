import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TeachersList } from '@/components/teachers';
import { getTeachers } from '@/lib/queries/teachers';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teachers' });
  return {
    // The title already ends with the school's name.
    title: { absolute: t('meta.title') },
    description: t('meta.description'),
  };
}

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const [teachers, { placeholders, visibility }] = await Promise.all([
    getTeachers(),
    getPeoplePageData(),
  ]);
  if (!isSectionVisible('teachers', visibility)) notFound();
  return <TeachersList teachers={teachers} placeholders={placeholders} />;
}
