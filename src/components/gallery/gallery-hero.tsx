import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { Album } from '@/lib/gallery/albums';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type SocialLinks = { facebook?: string; youtube?: string };

const link = 'inline-flex min-h-11 items-center gap-2 text-16 font-strong text-rust no-underline hover:text-rust-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * The page's opening, on `paper`: the H1, what the gallery holds, the school's Facebook page and YouTube channel (Site
 * Settings → social media, when active), and the latest album as a collage of its first three photos.
 */
export async function GalleryHero({ locale, latest, social, meta }: { locale: Locale; latest: Album | null; social: SocialLinks; meta: string[] }) {
  const t = await getTranslations({ locale, namespace: 'gallery.hero' });
  const photos = latest?.photos.slice(0, 3) ?? [];
  return (
    <section className="bg-paper text-ink">
      <div className="page-wrap grid items-center gap-9 pb-[clamp(56px,6vw,96px)] pt-[clamp(40px,5vw,80px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="flex flex-col items-start gap-[18px]">
          <p className="m-0 text-14 font-strong tracking-[0.02em] text-ink-muted">{t('eyebrow')}</p>
          <h1 className="m-0 text-hero text-balance">{t('title')}</h1>
          <p className="m-0 max-w-[40em] text-lead text-ink-body">{t('lead')}</p>
          {(social.facebook || social.youtube) && (
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className={link}>
                  <Icon name="facebook-logo" />
                  {t('facebook')}
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className={link}>
                  <Icon name="youtube-logo" />
                  {t('youtube')}
                </a>
              )}
            </div>
          )}
        </div>

        {latest && photos.length > 0 && (
          <Link href={`/${locale}/gallery/${latest.slug}`} className="group flex flex-col gap-[18px] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
            <div className={cn('grid gap-2.5', photos.length > 2 ? 'grid-cols-2 grid-rows-[230px_120px] sm:h-[470px] sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:grid-rows-2' : 'h-[300px] grid-cols-1 sm:h-[470px]', photos.length === 2 && 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')}>
              {photos.map((p, i) => (
                <div key={p.key} className={cn('relative overflow-hidden rounded-photo bg-sand-pale', i === 0 && 'shadow-photo', i === 0 && photos.length > 2 && 'col-span-2 sm:col-span-1 sm:row-span-2')}>
                  {i === 0 && <span className="absolute left-3.5 top-3.5 z-[2] inline-flex h-[30px] items-center rounded-full bg-dark px-3 text-13 font-strong text-cream">{t('latest')}</span>}
                  <Image src={p.src} alt={i === 0 ? p.alt : ''} fill priority={i === 0} sizes={i === 0 ? '(min-width: 1024px) 460px, 100vw' : '(min-width: 1024px) 230px, 50vw'} className="object-cover" style={{ objectPosition: p.position }} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="flex flex-col gap-1.5">
                <h2 className="m-0 text-h3 group-hover:text-rust">{latest.title}</h2>
                <p className="m-0 flex flex-wrap gap-x-3.5 gap-y-1.5 text-14 text-ink-muted">
                  {meta.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-16 font-strong text-rust">
                {t('open')}
                <Icon name="arrow-right" size={18} />
              </span>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
