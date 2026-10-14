import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { SiteSettings } from '@/types/sanity';
import { urlFor } from '@/lib/sanity';
import { ButtonLink } from '@/components/site/button';
import { Icon, type IconName } from '@/components/site/icon';
import { cn } from '@/lib/utils';
import { HeroGallery, type HeroPhoto } from './hero-gallery';

const CHIPS: { icon: IconName; a: string; b: string; tone: string; sub: string }[] = [
  { icon: 'book-open-text', a: 'chip2a', b: 'chip2b', tone: 'bg-sand', sub: 'text-ink-body' },
  { icon: 'translate', a: 'chip3a', b: 'chip3b', tone: 'bg-paper', sub: 'text-ink-muted' },
];

const chip = 'flex flex-wrap content-start items-center gap-x-3 gap-y-2.5 rounded-card px-4 py-3.5 motion-safe:animate-rise';
const lines = 'flex flex-[1_1_128px] flex-col leading-[1.3]';

/** Photos from the CMS (siteSettings.heroImages): the title in the page language is the alt text, else the CMS alt. */
function heroPhotos(siteSettings: SiteSettings | null, locale: Locale): HeroPhoto[] {
  return (siteSettings?.heroImages ?? [])
    .filter((h) => h.image?.asset)
    .map((h) => ({
      src: urlFor(h.image).width(1600).url(),
      alt: h.title?.[locale]?.trim() || h.alt || '',
      position: h.image.hotspot ? `${h.image.hotspot.x * 100}% ${h.image.hotspot.y * 100}%` : '50% 50%',
    }));
}

/** The homepage hero: the name and the promise, the two actions, the photos and three chips. */
export async function Hero({ locale, siteSettings }: { locale: Locale; siteSettings: SiteSettings | null }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  const photos = heroPhotos(siteSettings, locale);
  return (
    <section data-hero className="bg-cream text-ink">
      <div className="page-wrap flex flex-wrap items-center gap-x-16 gap-y-11 pb-[clamp(3rem,6vw,5.5rem)] pt-[clamp(2rem,5vw,4.5rem)]">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-[clamp(1.5rem,3vw,2.25rem)]">
          <h1 className="m-0 text-hero text-balance">
            <span className="block whitespace-nowrap text-rust">{t('name')}</span>
            <span className="block">{t('line')}</span>
          </h1>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/${locale}/pre-admission`} size="lg">
              {t('apply')}
              <Icon name="arrow-right" />
            </ButtonLink>
            <ButtonLink href="/api/download-prospectus" variant="outline" size="lg" className="px-6">
              <Icon name="download-simple" />
              {t('prospectus')}
            </ButtonLink>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_520px] flex-col">
          <HeroGallery photos={photos} label={t('gallery')} pauseLabel={t('pause')} />
          <ul className={cn('relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] gap-2.5 px-[clamp(10px,1.6vw,20px)]', photos.length > 0 && '-mt-10')}>
            <li className={cn(chip, 'bg-dark text-on-dark shadow-raise')} style={{ animationDelay: '240ms' }}>
              <strong className="text-figure-sm">{t('fifty')}</strong>
              <span className={lines}>
                <span className="text-15 font-strong leading-[1.3]">{t('chip1a')}</span>
                <span className="text-13 leading-[1.3] text-on-dark-muted">{t('chip1b')}</span>
              </span>
            </li>
            {CHIPS.map((c, i) => (
              <li key={c.icon} className={cn(chip, c.tone, 'text-ink shadow-raise-rust')} style={{ animationDelay: `${320 + i * 80}ms` }}>
                <Icon name={c.icon} size={28} className="shrink-0 text-rust" />
                <span className={lines}>
                  <span className="text-15 font-strong leading-[1.3]">{t(c.a)}</span>
                  <span className={cn('text-13 leading-[1.3]', c.sub)}>{t(c.b)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
