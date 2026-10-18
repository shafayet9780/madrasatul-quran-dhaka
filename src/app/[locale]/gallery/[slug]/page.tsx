import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { generatePageMetadata } from '@/lib/page-metadata';
import { getContentService } from '@/lib/content-service';
import { isSectionVisible } from '@/lib/nav-visibility';
import { getSiteUrl } from '@/lib/site-url';
import { generateBreadcrumbStructuredData, serializeJsonLd } from '@/lib/seo';
import { albumJsonLd, neighbours, num, type Album } from '@/lib/gallery/albums';
import { albumIn, albumsIn, galleryWords, shareImage } from '@/components/gallery/gallery-data';
import { AlbumPhotos } from '@/components/gallery/album-photos';
import { ShareAlbum } from '@/components/gallery/share-album';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = getContentService(false);
  const [settings, raw] = await Promise.all([content.getSiteSettings(), content.getAlbum(slug)]);
  const album = raw && isSectionVisible('gallery', settings?.navigationVisibility) ? albumIn(raw, locale) : null;
  if (!album) return {};
  const { t } = await galleryWords(locale);
  return generatePageMetadata({
    title: t('album.meta', { title: album.title }),
    description: album.summary || t('meta.description'),
    locale,
    path: `/gallery/${album.slug}`,
    share: shareImage(raw, album),
  });
}

/**
 * One album (docs/gallery.md): where it sits in the gallery, its name, day and counts, sending it on WhatsApp, then its
 * photos and videos. With text (Studio → Gallery → Text) it opens as a short story first: the first photo large with its
 * caption, the text, a teacher's words, then all the photos. The older and the newer album close the page.
 */
export default async function AlbumPage({ params }: Props) {
  const { locale, slug } = await params;
  const content = getContentService(false);
  const [settings, raw, list] = await Promise.all([content.getSiteSettings(), content.getAlbum(slug), content.getAlbums()]);
  if (!isSectionVisible('gallery', settings?.navigationVisibility) || !raw) notFound();
  const album = albumIn(raw, locale);
  if (!album) notFound();

  const [words, nav] = await Promise.all([galleryWords(locale), getTranslations({ locale, namespace: 'site.nav' })]);
  const { t } = words;
  const gallery = nav('gallery');
  const path = `/${locale}/gallery/${album.slug}`;
  const url = `${getSiteUrl()}${path}`;
  const story = album.story.length > 0 || album.quote !== null;
  const lead = story ? album.photos[0] : undefined;
  const { older, newer } = neighbours(albumsIn(list, locale), album.slug);
  const crumbs = [album.date ? num(Number(album.date.slice(0, 4)), locale) : t('album.ever'), words.topics[album.topic]];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(albumJsonLd(album, url, locale)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateBreadcrumbStructuredData([{ name: gallery, url: `/${locale}/gallery` }, { name: album.title, url: path }], locale)) }}
      />
      <article className="bg-paper text-ink">
        <div className="page-wrap pb-section">
          <div className="grid items-end gap-6 pb-10 pt-[clamp(36px,4vw,64px)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            <div className="flex flex-col items-start gap-3.5">
              <nav aria-label={t('album.crumbs')}>
                <ol className="m-0 flex list-none flex-wrap gap-2 p-0 text-14 text-ink-muted">
                  <li>
                    <Link href={`/${locale}/gallery`} className="font-strong text-rust no-underline hover:text-rust-deep">
                      {gallery}
                    </Link>
                  </li>
                  {crumbs.map((c) => (
                    <li key={c} className="before:mr-2 before:content-['/']">
                      {c}
                    </li>
                  ))}
                </ol>
              </nav>
              <h1 className="m-0 text-hero text-balance">{album.title}</h1>
              <p className="m-0 flex flex-wrap gap-x-3.5 gap-y-1.5 text-15 text-ink-muted">
                {words.meta(album).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </p>
              {album.summary && <p className="m-0 max-w-[40em] text-lead text-ink-body">{album.summary}</p>}
            </div>
            <ShareAlbum title={album.title} url={url} labels={{ share: t('album.share'), copy: t('album.copy'), copied: t('album.copied') }} />
          </div>

          {lead && (
            <figure className="m-0 flex flex-col gap-2.5">
              <div className="relative h-[300px] overflow-hidden rounded-photo bg-sand-pale shadow-photo md:h-[620px]">
                <Image src={lead.src} alt={lead.alt} fill priority sizes="(min-width: 1320px) 1240px, 100vw" className="object-cover" style={{ objectPosition: lead.position }} />
              </div>
              {lead.caption && <figcaption className="text-14 leading-normal text-ink-muted">{lead.caption}</figcaption>}
            </figure>
          )}
          {album.story.length > 0 && (
            <div className="mx-auto mt-10 flex max-w-[680px] flex-col gap-[18px] text-17 leading-[1.75] text-ink-body md:mt-16 md:text-19">
              {album.story.map((p, i) => (
                <p key={i} className="m-0">
                  {p}
                </p>
              ))}
            </div>
          )}
          {album.quote && (
            <figure className="mx-auto mt-11 flex max-w-[820px] flex-col gap-[18px] border-l-4 border-bronze pl-[18px] md:mt-16 md:pl-7">
              <blockquote className="m-0">
                <p className="m-0 font-quote text-quote text-ink">{album.quote.text}</p>
              </blockquote>
              {album.quote.by && <figcaption className="text-15 font-strong text-ink-muted">{album.quote.by}</figcaption>}
            </figure>
          )}

          {story && (
            <div className="mb-5 mt-14 flex flex-wrap items-baseline justify-between gap-4 md:mt-[88px]">
              <h2 className="m-0 text-h3">{t('album.all')}</h2>
              <p className="m-0 text-14 text-ink-muted">{t('album.tapHint')}</p>
            </div>
          )}
          <AlbumPhotos
            photos={album.photos}
            videos={album.videos}
            title={album.title}
            dateText={album.dateText}
            url={url}
            numbers={album.photos.map((_, i) => num(i + 1, locale))}
            player={words.player}
            labels={{
              label: t('viewer.label'),
              counter: t.raw('viewer.counter') as string,
              prev: t('viewer.prev'),
              next: t('viewer.next'),
              close: t('viewer.close'),
              send: t('viewer.send'),
              copy: t('viewer.copy'),
              copied: t('viewer.copied'),
              swipe: t('viewer.swipe'),
              thumbs: t('viewer.thumbs'),
              open: t.raw('viewer.open') as string,
            }}
          />
        </div>
      </article>

      <nav aria-label={t('album.back')} className="bg-cream text-ink">
        <div className="page-wrap flex flex-col gap-6 py-[clamp(48px,6vw,80px)]">
          {(older || newer) && (
            <div className="grid gap-6 md:grid-cols-2">
              {older ? <Neighbour album={older} href={`/${locale}/gallery/${older.slug}`} label={t('album.older')} meta={neighbourMeta(older, words.photos)} /> : <span className="hidden md:block" />}
              {newer && <Neighbour album={newer} href={`/${locale}/gallery/${newer.slug}`} label={t('album.newer')} meta={neighbourMeta(newer, words.photos)} next />}
            </div>
          )}
          <Link href={`/${locale}/gallery`} className="inline-flex min-h-11 items-center gap-2 self-start text-16 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            {t('album.back')}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>
      </nav>
    </>
  );
}

const neighbourMeta = (a: Album, photos: (n: number) => string) => [a.dayText, a.photoCount ? photos(a.photoCount) : ''].filter(Boolean).join(' · ');

/** The older or the newer album: its cover, which way it is, its name, day and photos. */
function Neighbour({ album, href, label, meta, next = false }: { album: Album; href: string; label: string; meta: string; next?: boolean }) {
  const cover = album.photos[0];
  return (
    <Link
      href={href}
      className={cn(
        'group grid grid-cols-[110px_minmax(0,1fr)] items-center gap-5 rounded-card bg-surface p-3.5 text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:grid-cols-[160px_minmax(0,1fr)]',
        next && 'md:grid-cols-[minmax(0,1fr)_160px] md:text-right',
      )}
    >
      <span className={cn('relative block aspect-[4/3] overflow-hidden rounded-cell bg-sand-pale', next && 'md:order-2')}>
        {cover && <Image src={cover.src} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: cover.position }} />}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-14 font-strong text-ink-muted">{label}</span>
        <span className="text-18 font-bold leading-snug group-hover:text-rust">{album.title}</span>
        {meta && <span className="text-14 text-ink-muted">{meta}</span>}
      </span>
    </Link>
  );
}
