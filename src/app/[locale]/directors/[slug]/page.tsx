import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { urlFor } from '@/lib/sanity';
import { getDirectorBySlug } from '@/lib/queries/directors';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';
import { DirectorDetail } from '@/components/directors';
import { generatePersonStructuredData, generateBreadcrumbStructuredData, serializeJsonLd } from '@/lib/seo';
import { getLocalizedText, type Language } from '@/lib/sanity-utils';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale as Language;
  const director = await getDirectorBySlug(slug, language);
  if (!director || director.showDetailPage === false) return { title: 'Director Not Found' };

  const name = getLocalizedText(director.name, language);
  const description =
    getLocalizedText(director.summary, language) || getLocalizedText(director.designation, language);
  return {
    title: `${name} - ${getLocalizedText(director.designation, language)}`,
    description,
  };
}

export default async function DirectorProfile({ params }: Props) {
  const { locale, slug } = await params;
  const language = locale as Language;

  const [director, { placeholders, visibility }] = await Promise.all([
    getDirectorBySlug(slug, language),
    getPeoplePageData(),
  ]);

  if (!director || director.showDetailPage === false || !isSectionVisible('directors', visibility)) {
    notFound();
  }

  const name = getLocalizedText(director.name, language);
  const imageUrl = director.photo ? urlFor(director.photo).width(400).height(400).url() : undefined;

  const personLd = generatePersonStructuredData(
    {
      name,
      jobTitle: getLocalizedText(director.designation, language),
      description: getLocalizedText(director.summary, language),
      imageUrl,
      url: `/${locale}/directors/${slug}`,
    },
    language
  );

  const breadcrumbLd = generateBreadcrumbStructuredData(
    [
      { name: language === 'bengali' ? 'হোম' : 'Home', url: `/${locale}` },
      { name: language === 'bengali' ? 'পরিচালকবৃন্দ' : 'Directors', url: `/${locale}/directors` },
      { name, url: `/${locale}/directors/${slug}` },
    ],
    language
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <DirectorDetail director={director} placeholders={placeholders} />
    </>
  );
}
