import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/page-seo';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { filterChoices, monthRows, num } from '@/lib/gallery/albums';
import { albumsIn, galleryWords, socialLinks } from '@/components/gallery/gallery-data';
import { GalleryHero } from '@/components/gallery/gallery-hero';
import { AlbumBrowser } from '@/components/gallery/album-browser';
import { GalleryWatch } from '@/components/gallery/gallery-watch';
import { GalleryEver } from '@/components/gallery/gallery-ever';
import { GalleryClose } from '@/components/gallery/gallery-close';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery.meta' });
  return pageMetadata({ page: 'gallery', title: t('title'), description: t('description'), locale, path: '/gallery' });
}

/**
 * The gallery (docs/gallery.md): the latest album, the dated albums month by month under a filter bar, the videos on
 * dark, the all-time albums, then come and see. Albums come from Studio → Gallery; the page shows once Menu and pages
 * switches the gallery on.
 */
export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = getContentService(false);
  const [settings, raw] = await Promise.all([content.getSiteSettings(), content.getAlbums()]);
  if (!isSectionVisible('gallery', settings?.navigationVisibility)) notFound();

  const albums = albumsIn(raw, locale);
  const words = await galleryWords(locale);
  const { t } = words;
  const social = socialLinks(settings);
  const rows = monthRows(albums, locale);
  const latest = albums.find((a) => a.date && a.photos.length) ?? albums.find((a) => a.photos.length) ?? null;
  const videos = albums.flatMap((a) => a.videos);
  const { years } = filterChoices(rows);

  return (
    <>
      <GalleryHero locale={locale} latest={latest} social={social} meta={latest ? words.meta(latest) : []} />
      <AlbumBrowser
        rows={rows}
        locale={locale}
        labels={{
          bar: t('filter.label'),
          year: t('filter.year'),
          topic: t('filter.topic'),
          all: t('topics.all'),
          topics: words.topics,
          titles: Object.fromEntries(years.map((y) => [y, t('rows.title', { year: num(Number(y), locale) })])),
          years: Object.fromEntries(years.map((y) => [y, num(Number(y), locale)])),
          empty: t('rows.empty'),
          showAll: t('rows.showAll'),
          video: t('watch.video'),
          counts: Object.fromEntries(albums.map((a) => [a.slug, { number: num(a.photoCount, locale), count: words.photos(a.photoCount) }])),
          player: words.player,
        }}
      />
      <GalleryWatch locale={locale} wide={videos.filter((v) => !v.upright)} upright={videos.filter((v) => v.upright)} youtube={social.youtube} player={words.player} />
      <GalleryEver locale={locale} albums={albums.filter((a) => !a.date)} counts={Object.fromEntries(albums.map((a) => [a.slug, words.photos(a.photoCount)]))} />
      <GalleryClose locale={locale} />
    </>
  );
}
