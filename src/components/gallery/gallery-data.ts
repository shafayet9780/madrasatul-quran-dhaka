import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { byDate, num, toAlbum, TOPICS, type Album, type AlbumIn, type AlbumPhotoIn } from '@/lib/gallery/albums';
import type { SocialLinks } from './gallery-hero';
import type { VideoLabels } from './video-tile';

/** A Studio photo's address, large enough for the viewer; next/image makes the smaller sizes from it. */
const photoSrc = (p: AlbumPhotoIn) => p.src ?? (p.asset?._ref ? urlFor(p).width(2400).fit('max').url() : undefined);

/** The albums the page can show, in the page's language: newest first, all-time ones last. */
export const albumsIn = (raw: AlbumIn[], locale: Locale): Album[] => raw.flatMap((a) => toAlbum(a, locale, photoSrc) ?? []).sort(byDate);
export const albumIn = (raw: AlbumIn, locale: Locale): Album | null => toAlbum(raw, locale, photoSrc);

/** The picture an album's link preview shows: its cover, cropped to 1200 × 630 on the hotspot. */
export const shareImage = (raw: AlbumIn | null, album: Album | null) => {
  const cover = raw?.photos?.[0];
  return cover?.asset?._ref && album?.photos[0] ? { url: urlFor(cover).width(1200).height(630).fit('crop').url(), alt: album.photos[0].alt } : undefined;
};

/** The school's Facebook page and YouTube channel, when School details lists them as active. */
export function socialLinks(settings: SiteSettings | null): SocialLinks {
  const active = (settings?.socialMedia ?? []).filter((s) => s.isActive && s.url);
  // The icon is picked from a list; the platform's name is typed, so it is the fallback.
  const find = (kind: string) => active.find((s) => (s.icon ?? s.platform?.toLowerCase()) === kind)?.url;
  return { facebook: find('facebook'), youtube: find('youtube') };
}

/** The words the gallery's pieces share: counts (১৮টি ছবি), topics, and the video player's buttons. */
export async function galleryWords(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  const photos = (n: number) => t('count.photos', { count: n, shown: num(n, locale) });
  const videos = (n: number) => t('count.videos', { count: n, shown: num(n, locale) });
  const topics = Object.fromEntries([...TOPICS, 'video' as const].map((k) => [k, t(`topics.${k}`)])) as Record<(typeof TOPICS)[number] | 'video', string>;
  const player: VideoLabels = { play: t.raw('watch.play') as string, close: t('watch.close'), onYoutube: t('watch.onYoutube') };
  /** The album's line under its name: the day, the photos and the videos. */
  const meta = (a: Album) => [a.dateText, a.photoCount ? photos(a.photoCount) : '', a.videos.length ? videos(a.videos.length) : ''].filter(Boolean);
  return { t, photos, videos, topics, player, meta };
}
