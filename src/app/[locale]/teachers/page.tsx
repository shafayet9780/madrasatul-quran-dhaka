import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
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
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function TeachersPage() {
  const [teachers, { placeholders, visibility }] = await Promise.all([
    getTeachers(),
    getPeoplePageData(),
  ]);
  if (!isSectionVisible('teachers', visibility)) notFound();
  return <TeachersList teachers={teachers} placeholders={placeholders} />;
}
