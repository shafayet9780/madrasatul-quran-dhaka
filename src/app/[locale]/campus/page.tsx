import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generatePageMetadata } from '@/lib/page-metadata';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { contactDetails } from '@/lib/contact/details';
import { urlFor } from '@/lib/sanity';
import { campusStops } from '@/lib/campus/day';
import { launchDay } from '@/lib/campus/launch-day';
import { CampusTour } from '@/components/campus/campus-tour';
import { CampusClose } from '@/components/campus/campus-close';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'campus.meta' });
  return generatePageMetadata({ title: t('title'), description: t('description'), locale, path: '/campus' });
}

/**
 * Campus: one school day told as the reader scrolls, from the metro in the morning to home time at 8:30 at night
 * (docs/campus-day.md). The stops come from Studio → Campus: a day; while it has none, the launch day. Shown while
 * Site Settings shows Campus. Then come and see: office hours, directions and a call.
 */
export default async function CampusPage({ params }: Props) {
  const { locale } = await params;
  const content = getContentService(false);
  const [settings, studio, home] = await Promise.all([content.getSiteSettings(), content.getCampusDay(), content.getHomePage()]);
  if (!isSectionVisible('campus', settings?.navigationVisibility)) notFound();

  const stops = campusStops(studio.length ? studio : launchDay(home?.playSpaces), locale, (p) => (p.asset?._ref ? urlFor(p).width(1600).url() : undefined));
  if (!stops.length) notFound();

  return (
    <>
      <CampusTour stops={stops} locale={locale} />
      <CampusClose locale={locale} details={contactDetails(settings, locale)} showGallery={isSectionVisible('gallery', settings?.navigationVisibility)} />
    </>
  );
}
