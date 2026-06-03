import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { urlFor } from '@/lib/sanity';
import { getTeacherBySlug } from '@/lib/queries/teachers';
import { getPeoplePageData } from '@/lib/queries/site';
import { isSectionVisible } from '@/lib/nav-visibility';
import { TeacherDetail } from '@/components/teachers';
import { generatePersonStructuredData, generateBreadcrumbStructuredData, serializeJsonLd } from '@/lib/seo';
import { getLocalizedText, type Language } from '@/lib/sanity-utils';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale as Language;
  const teacher = await getTeacherBySlug(slug, language);
  if (!teacher || teacher.showDetailPage === false) return { title: 'Teacher Not Found' };

  const name = getLocalizedText(teacher.name, language);
  const description =
    getLocalizedText(teacher.summary, language) ||
    (teacher.designation ? getLocalizedText(teacher.designation, language) : name);
  return { title: `${name} - Madrasatul Quran`, description };
}

export default async function TeacherProfile({ params }: Props) {
  const { locale, slug } = await params;
  const language = locale as Language;

  const [teacher, { placeholders, visibility }] = await Promise.all([
    getTeacherBySlug(slug, language),
    getPeoplePageData(),
  ]);

  if (!teacher || teacher.showDetailPage === false || !isSectionVisible('teachers', visibility)) {
    notFound();
  }

  const name = getLocalizedText(teacher.name, language);
  const imageUrl = teacher.photo ? urlFor(teacher.photo).width(400).height(400).url() : undefined;

  const personLd = generatePersonStructuredData(
    {
      name,
      jobTitle: teacher.designation ? getLocalizedText(teacher.designation, language) : undefined,
      description: getLocalizedText(teacher.summary, language),
      imageUrl,
      url: `/${locale}/teachers/${slug}`,
    },
    language
  );

  const breadcrumbLd = generateBreadcrumbStructuredData(
    [
      { name: language === 'bengali' ? 'হোম' : 'Home', url: `/${locale}` },
      { name: language === 'bengali' ? 'শিক্ষকমণ্ডলী' : 'Teachers', url: `/${locale}/teachers` },
      { name, url: `/${locale}/teachers/${slug}` },
    ],
    language
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      <TeacherDetail teacher={teacher} placeholders={placeholders} />
    </>
  );
}
