import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { DIRECTIONS_URL, type contactDetails } from '@/lib/contact/details';
import { ButtonLink } from '@/components/site/button';
import { Icon } from '@/components/site/icon';
import { WalkSketch, sketchCopy } from '@/components/site/walk-sketch';
import { MapOnTap } from './map-on-tap';

type Details = ReturnType<typeof contactDetails>;

/**
 * How to get here, on `dark`: the line and the walk from the metro, the landmarks (School details → location), Google's map
 * when asked for, and links to directions and to the place on Google Maps.
 */
export async function ContactFind({ locale, details }: { locale: Locale; details: Details }) {
  const t = await getTranslations({ locale, namespace: 'contact.find' });
  const campus = await getTranslations({ locale, namespace: 'home.campus' });
  const { gettingHere, metro, landmarks, mapEmbed, mapUrl } = details;
  return (
    <section id="find" className="bg-dark text-on-dark">
      <div className="page-wrap flex flex-col gap-9 py-section">
        {/* The address is in the page's hero. */}
        <h2 className="m-0 max-w-[820px] text-h2 text-balance">{gettingHere || campus('where.title')}</h2>
        <div className="flex flex-wrap items-stretch gap-x-10 gap-y-5">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            {metro && (
              <div className="rounded-panel bg-panel p-[clamp(18px,3vw,32px)]">
                {/* As wide as on the homepage: stretched across a tablet it would dwarf the rest. */}
                <div className="mx-auto max-w-[560px]">
                  <WalkSketch c={sketchCopy(campus.raw('sketch'), metro)} />
                </div>
              </div>
            )}
            {landmarks.length > 0 && (
              <div>
                <h3 className="sr-only">{t('landmarks')}</h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {landmarks.map((l) => (
                    <li key={l.name} className="flex items-center gap-3.5 border-t border-line-dark py-3.5">
                      <Icon name="train" size={22} className="shrink-0 text-bronze-light" />
                      <span className="flex-1 text-17 text-on-dark-body">{l.name}</span>
                      {l.distance && <strong className="whitespace-nowrap text-17 font-strong">{l.distance}</strong>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-[1.2_1_420px] flex-col gap-3.5">
            {mapEmbed && <MapOnTap src={mapEmbed} labels={{ show: t('showMap'), note: t('mapNote'), title: t('mapTitle') }} />}
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" variant="light" className="min-h-12 px-[22px] text-16">
                <Icon name="navigation-arrow" />
                {t('directions')}
              </ButtonLink>
              {mapUrl && (
                <ButtonLink href={mapUrl} target="_blank" rel="noopener noreferrer" variant="outline-dark" className="min-h-12 border-[1.5px] px-[22px] text-16">
                  {campus('where.map')}
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
