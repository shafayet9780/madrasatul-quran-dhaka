import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeachersList } from '@/components/teachers';
import { getTeachers } from '@/lib/queries/teachers';
import { getProfilePlaceholders } from '@/lib/queries/site';

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
  const [teachers, placeholders] = await Promise.all([getTeachers(), getProfilePlaceholders()]);
  return <TeachersList teachers={teachers} placeholders={placeholders} />;
}
