import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AdvisorsList } from '@/components/advisors';
import { getAdvisors } from '@/lib/queries/advisors';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'advisors' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function AdvisorsPage() {
  const [advisors, { placeholders, visibility }] = await Promise.all([
    getAdvisors(),
    getPeoplePageData(),
  ]);
  if (!isSectionVisible('advisors', visibility)) notFound();
  return <AdvisorsList advisors={advisors} placeholders={placeholders} />;
}
