import type { Metadata } from 'next';
import type { Locale } from './i18n';
import type { SeoPage, SeoSettings } from '@/types/sanity';
import { generatePageMetadata } from './page-metadata';
import { getContentService } from './content-service';
import { urlFor } from './sanity';

type PageMetadataArgs = Parameters<typeof generatePageMetadata>[0];

/**
 * A page's title and description: Studio → Search & sharing when filled in, else the page's own wording. `{name}` in
 * the Studio text becomes `vars.name` (the pre-admission session). Pure.
 */
export function seoText(
  settings: SeoSettings | null | undefined,
  page: SeoPage | undefined,
  locale: Locale,
  own: { title: string; description: string },
  vars: Record<string, string> = {},
): { title: string; description: string } {
  const entry = page ? settings?.pages?.[page] : undefined;
  const fill = (value: string | undefined, fallback: string) => {
    const text = value?.trim();
    return text ? text.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match) : fallback;
  };
  return { title: fill(entry?.title?.[locale], own.title), description: fill(entry?.description?.[locale], own.description) };
}

/** Studio → Search & sharing → Share picture, cut to the size link previews use. */
export function sharePicture(settings: SeoSettings | null | undefined, locale: Locale): { url: string; alt: string } | undefined {
  const image = settings?.shareImage;
  if (!image?.asset) return undefined;
  return { url: urlFor(image).width(1200).height(630).fit('crop').url(), alt: image.alt?.[locale]?.trim() || image.alt?.bengali || '' };
}

/** The page's metadata (generatePageMetadata) with Studio → Search & sharing over the page's own wording. */
export async function pageMetadata({ page, vars, ...args }: PageMetadataArgs & { page?: SeoPage; vars?: Record<string, string> }): Promise<Metadata> {
  const settings = await getContentService(false).getSeoSettings();
  return generatePageMetadata({
    ...args,
    ...seoText(settings, page, args.locale, args, vars),
    share: args.share ?? sharePicture(settings, args.locale),
  });
}
