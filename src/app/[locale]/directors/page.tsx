import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DirectorsList } from '@/components/directors';
import { getDirectors } from '@/lib/queries/directors';
import { getProfilePlaceholders } from '@/lib/queries/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'directors' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function DirectorsPage() {
  const [directors, placeholders] = await Promise.all([getDirectors(), getProfilePlaceholders()]);
  return <DirectorsList directors={directors} placeholders={placeholders} />;
}
