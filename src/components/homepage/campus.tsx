import Image from 'next/image';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { WalkSketch } from '@/components/site/walk-sketch';
import { cn } from '@/lib/utils';
import { urlFor } from '@/lib/sanity';
import type { HomePage, HomePhoto } from '@/types/home';

type Spot = { line: string; dot: [number, number]; box: CSSProperties; tag: CSSProperties };
type Collage = { ratio: string; photo: CSSProperties; roof: Spot; field: Spot };

// Positions in % of the collage box. A line runs from each play space to where it is on the building photo.
const WIDE: Collage = {
  ratio: '1160 / 470',
  photo: { left: '31%', top: 0, width: '38%', height: '100%' },
  roof: { line: '26,26 40,26 47.5,10', dot: [47.5, 10], box: { left: 0, top: '2%', width: '26%', height: '48%' }, tag: { left: 0, top: '54%', width: '26%' } },
  field: { line: '74,66 62,66 60,88', dot: [60, 88], box: { right: 0, bottom: '2%', width: '26%', height: '48%' }, tag: { right: 0, bottom: '54%', width: '26%' } },
};
const TALL: Collage = {
  ratio: '358 / 700',
  photo: { left: '14%', top: '17%', width: '86%', height: '58%' },
  roof: { line: '30,12 30,20 55,24', dot: [55, 24], box: { left: 0, top: 0, width: '60%', height: '15%' }, tag: { left: '63%', top: '2%', width: '37%' } },
  field: { line: '70,84 70,77 72,71', dot: [72, 71], box: { right: 0, bottom: 0, width: '60%', height: '15%' }, tag: { left: 0, bottom: '2%', width: '37%' } },
};

const PHOTOS = ['/images/home/campus-entrance.jpg', '/images/home/campus-classroom.jpg']; // in the order of home.campus.photos

type Space = { title: string; sub: string; placeholder: string; photo?: { src: string; alt: string; position: string } };

/** A play space's photo from the CMS (Studio → Homepage → Play spaces), framed on its hotspot. */
function spacePhoto(photo: HomePhoto | undefined, locale: Locale): Space['photo'] {
  if (!photo?.asset) return undefined;
  const { x = 0.5, y = 0.5 } = photo.hotspot ?? {};
  return { src: urlFor(photo).width(900).url(), alt: photo.alt?.[locale] ?? '', position: `${x * 100}% ${y * 100}%` };
}

/** The building photo with the girls' rooftop garden and the boys' field beside it. The lines and dots are decoration. */
function PlaySpaces({ layout, spaces, buildingAlt, className }: { layout: Collage; spaces: Record<'roof' | 'field', Space>; buildingAlt: string; className: string }) {
  return (
    <div className={cn('relative', className)} style={{ aspectRatio: layout.ratio }}>
      <div className="absolute overflow-hidden rounded-photo" style={layout.photo}>
        <Image src="/images/home/campus-building.jpg" alt={buildingAlt} fill sizes="(min-width: 760px) 470px, 380px" className="object-cover object-top" />
      </div>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {(['roof', 'field'] as const).map((k) => (
          <g key={k} fill="none">
            <polyline points={layout[k].line} stroke="rgb(44 31 21 / 0.55)" strokeWidth={5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={layout[k].line} stroke="var(--color-bronze-light)" strokeWidth={2} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>
      {(['roof', 'field'] as const).map((k) => (
        <span
          key={k}
          aria-hidden="true"
          className="absolute -ml-2 -mt-2 size-4 rounded-full bg-bronze-light shadow-[0_0_0_3px_var(--color-dark),0_0_0_7px_rgb(226_168_103/0.35)]"
          style={{ left: `${layout[k].dot[0]}%`, top: `${layout[k].dot[1]}%` }}
        />
      ))}
      {(['roof', 'field'] as const).map((k) => (
        <div key={k}>
          {/* The space's photo from the CMS; until there is one, a marked placeholder. */}
          <div className="absolute flex flex-col items-center justify-center gap-2 overflow-hidden rounded-photo bg-panel p-2.5 text-center text-on-dark-muted shadow-frame-dark" style={layout[k].box}>
            {spaces[k].photo ? (
              <Image src={spaces[k].photo.src} alt={spaces[k].photo.alt} fill sizes="(min-width: 760px) 320px, 60vw" className="object-cover" style={{ objectPosition: spaces[k].photo.position }} />
            ) : (
              <>
                <Icon name="image" size={34} className="text-ink-faint" />
                <span className="text-13 leading-[1.4]">{spaces[k].placeholder}</span>
              </>
            )}
          </div>
          <p className="absolute m-0 flex flex-col gap-0.5 leading-[1.3]" style={layout[k].tag}>
            <strong className="text-[clamp(15px,1.5vw,18px)] font-bold">{spaces[k].title}</strong>
            <span className="text-13 text-on-dark-muted">{spaces[k].sub}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

/** The campus: where the students play, two photos of the school, and how to get there from the metro; the Campus page while Site Settings shows it. */
export async function Campus({ locale, mapUrl, playSpaces, showVisit }: { locale: Locale; mapUrl?: string; playSpaces?: HomePage['playSpaces']; showVisit: boolean }) {
  const t = await getTranslations({ locale, namespace: 'home.campus' });
  const spaces: Record<'roof' | 'field', Space> = {
    roof: { ...t.raw('roof'), photo: spacePhoto(playSpaces?.roof, locale) },
    field: { ...t.raw('field'), photo: spacePhoto(playSpaces?.field, locale) },
  };
  const photos = t.raw('photos') as { caption: string; alt: string }[];
  return (
    <section className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-9 py-section">
        <div className="flex max-w-narrow flex-col gap-3.5">
          <h2 className="m-0 text-h2 text-balance">{t('title')}</h2>
          <p className="m-0 text-19 text-on-dark-body">{t('lede')}</p>
        </div>

        <div className="flex flex-col gap-5">
          <h3 className="m-0 text-h3">{t('playTitle')}</h3>
          <PlaySpaces layout={WIDE} spaces={spaces} buildingAlt={t('buildingAlt')} className="hidden min-[760px]:block" />
          <PlaySpaces layout={TALL} spaces={spaces} buildingAlt={t('buildingAlt')} className="max-w-[440px] min-[760px]:hidden" />
        </div>

        <div className="flex flex-wrap gap-4">
          {photos.map((p, i) => (
            <figure key={p.alt} className="m-0 flex min-w-0 flex-[1_1_300px] flex-col gap-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-photo">
                <Image src={PHOTOS[i]} alt={p.alt} fill sizes="(min-width: 700px) 50vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="text-14 text-on-dark-muted">{p.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-12 gap-y-7 rounded-panel bg-panel p-[clamp(18px,3vw,36px)]">
          <div className="min-w-0 max-w-[560px] flex-[1_1_320px]">
            <WalkSketch c={t.raw('sketch')} />
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
            <h3 className="m-0 text-h3">{t('where.title')}</h3>
            <p className="m-0 text-17 text-on-dark-body">{t('where.address')}</p>
            <p className="m-0 text-15 text-on-dark-muted">{t('where.landmarks')}</p>
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {mapUrl && (
                <ButtonLink href={mapUrl} variant="light" className="min-h-12 px-[22px] text-16">
                  {t('where.map')}
                </ButtonLink>
              )}
              {showVisit && (
                <ButtonLink href={`/${locale}/campus`} variant="outline-dark" className="min-h-12 border-[1.5px] px-[22px] text-16">
                  {t('where.visit')}
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
