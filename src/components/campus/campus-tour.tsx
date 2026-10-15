import Image from 'next/image';
import type { CSSProperties } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import { dayBeats, firstBeat, floorName, liftRows, type Stop } from '@/lib/campus/day';
import { Icon } from '@/components/site/icon';
import { TourDriver } from './tour-driver';
import { TourStage, type StageCopy } from './tour-stage';
import './campus-day.css';

/** Without script the stage cannot follow the reader: show each step's photos instead, as with reduced motion. */
const NO_SCRIPT = '<style>.cd-stage{display:none}.cd-still{display:grid}.cd-step{min-height:0}.cd-step-body{position:static;padding-block:32px}</style>';

/** How much scroll a step takes (vh on desktop, svh on phones): longer for each extra moment, shorter for a floor. */
function stepHeight(s: Stop, i: number, last: boolean): [number, number] {
  const [h, hp] = i === 0 || last ? [100, i === 0 ? 70 : 90] : s.kind === 'floor' ? [72, 70] : [95, 80];
  return [h + (s.beats.length - 1) * 22, hp + (s.beats.length - 1) * 18];
}

/**
 * A day on campus: the steps scroll as ordinary text (the first step's heading is the page's H1), and the stage beside
 * them plays the day. Server HTML throughout; TourDriver only follows the scroll.
 */
export async function CampusTour({ stops, locale }: { stops: Stop[]; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'campus.stage' });
  const beats = dayBeats(stops);
  const stopBeats = stops.map((s, i) => s.beats.map((_, j) => firstBeat(stops, i) + j));
  const rows = liftRows(stops);
  const lift = beats.some((b) => b.lift !== null) ? rows.map((r) => floorName(r, locale, t.raw('lift'))) : [];
  const copy: StageCopy = { groups: t.raw('groups'), walk: t.raw('walk') };

  return (
    <TourDriver
      className="cd-tour page-wrap"
      style={{ timelineScope: stops.map((_, i) => `--t${i}`).join(', ') }}
      beats={beats.map((b) => ({ sky: b.sky, groups: b.groups.join(' '), sun: b.sun, lift: b.lift }))}
      counts={stops.map((s) => s.beats.length)}
    >
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />
      <div className="cd-steps">
        <span className="cd-rail" aria-hidden="true">
          <i />
        </span>
        {stops.map((s, i) => {
          const [h, hp] = stepHeight(s, i, i === stops.length - 1);
          const list = stopBeats[i];
          return (
            <section
              key={s.key}
              data-step
              data-beats={list.join(' ')}
              data-pos={i === 0 ? 'now' : 'next'}
              className="cd-step"
              style={{ '--tl': `--t${i}`, '--h': h, '--hp': hp } as CSSProperties}
            >
              <div className="cd-step-body">
                <span className="cd-dot" aria-hidden="true" />
                <p className="m-0 inline-flex items-center gap-2 text-15 font-strong text-rust">
                  <Icon name="clock" size={18} />
                  {s.label}
                </p>
                {s.place && <p className="m-0 text-14 font-strong text-ink-muted">{s.place}</p>}
                {i === 0 ? (
                  <h1 className="m-0 text-hero text-balance">{s.title}</h1>
                ) : (
                  <h2 className="m-0 text-[clamp(1.625rem,3vw,2.5rem)] font-heading leading-[1.18] text-balance">{s.title}</h2>
                )}
                <p className="m-0 max-w-[26em] text-17 text-ink-body lg:text-19">{s.text}</p>
                {s.photos.length > 0 && (
                  <div className="cd-still mt-2.5 max-w-[760px] grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
                    {s.photos.map((p) => (
                      <figure key={p.src} className="m-0 flex flex-col gap-1.5">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-photo bg-sand-pale">
                          <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" style={{ objectPosition: p.position }} />
                        </div>
                        {p.name && <figcaption className="text-14 text-ink-muted">{p.name}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <TourStage stops={stops} beats={beats} stopBeats={stopBeats} lift={lift} copy={copy} />
    </TourDriver>
  );
}
