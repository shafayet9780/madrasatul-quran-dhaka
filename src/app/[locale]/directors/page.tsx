import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DirectorsList } from '@/components/directors';
import { getDirectors } from '@/lib/queries/directors';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';

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
  const [directors, { placeholders, visibility }] = await Promise.all([
    getDirectors(),
    getPeoplePageData(),
  ]);
  if (!isSectionVisible('directors', visibility)) notFound();
  return <DirectorsList directors={directors} placeholders={placeholders} />;
}
