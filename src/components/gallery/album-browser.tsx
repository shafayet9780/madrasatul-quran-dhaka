'use client';

import { useRef, useState } from 'react';
import { filterChoices, filterRows, type MonthRow, type Topic } from '@/lib/gallery/albums';
import { AlbumCard } from './album-card';
import { VideoTile, type VideoLabels } from './video-tile';
import { cn } from '@/lib/utils';

export type BrowserLabels = {
  bar: string;
  year: string;
  topic: string;
  all: string;
  topics: Record<Topic | 'video', string>;
  /** Per year, written out: ২০২৬ সালের অ্যালবাম. */
  titles: Record<string, string>;
  years: Record<string, string>;
  empty: string;
  showAll: string;
  video: string;
  /** Per album: the number on its badge and the count read out. */
  counts: Record<string, { number: string; count: string }>;
  player: VideoLabels;
};

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const chip = cn('inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-15 font-strong', focusRing);
const chipOff = 'text-ink-body shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] hover:text-rust';
const chipOn = 'bg-dark text-cream';

/**
 * The dated albums, month by month, under a filter bar that sticks to the top: the year switch (only once there are
 * albums from two years), then a chip per topic that has albums, and Videos. Albums and their wide videos share the rows.
 */
export function AlbumBrowser({ rows, locale, labels }: { rows: MonthRow[]; locale: string; labels: BrowserLabels }) {
  const { years, topics } = filterChoices(rows);
  const [year, setYear] = useState(years[0] ?? null);
  const [topic, setTopic] = useState<Topic | 'video' | null>(null);
  const top = useRef<HTMLElement>(null);
  const shown = filterRows(rows, { year: years.length > 1 ? year : null, topic });
  const heading = labels.titles[year ?? ''] ?? labels.titles[years[0]];

  // A new choice starts at the top of the albums when the bar is already stuck.
  const pick = (next: () => void) => {
    next();
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: 'start' });
  };

  if (!rows.length) return null;
  return (
    <section ref={top} aria-labelledby="gallery-albums" className="bg-cream text-ink">
      {(topics.length > 1 || years.length > 1) && (
        <div role="group" aria-label={labels.bar} className="sticky top-0 z-20 border-y border-line bg-cream/95 backdrop-blur-sm">
          <div className="page-wrap flex items-center gap-5 py-3">
            {years.length > 1 && (
              <>
                <div role="group" aria-label={labels.year} className="inline-flex shrink-0 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--color-line)]">
                  {years.map((y) => (
                    <button key={y} type="button" aria-pressed={y === year} onClick={() => pick(() => setYear(y))} className={cn('inline-flex h-9 items-center rounded-full px-4 text-15 font-strong', focusRing, y === year ? chipOn : 'text-ink-body hover:text-rust')}>
                      {labels.years[y]}
                    </button>
                  ))}
                </div>
                <span aria-hidden="true" className="h-8 w-px shrink-0 bg-line-strong" />
              </>
            )}
            <div role="group" aria-label={labels.topic} className="-my-1 flex min-w-0 gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
              {[null, ...topics].map((t) => (
                <button key={t ?? 'all'} type="button" aria-pressed={t === topic} onClick={() => pick(() => setTopic(t))} className={cn(chip, t === topic ? chipOn : chipOff)}>
                  {t ? labels.topics[t] : labels.all}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="page-wrap pb-section pt-[clamp(40px,5vw,64px)]">
        <h2 id="gallery-albums" className="m-0 text-h3 text-balance">
          {heading}
        </h2>
        {shown.length ? (
          shown.map((row) => (
            <div key={row.key} className="grid gap-[18px] border-t border-line py-9 first-of-type:mt-4 first-of-type:border-t-0 first-of-type:pt-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:py-12">
              <h3 className="m-0 self-start text-h4 md:sticky md:top-24">{row.label}</h3>
              <ul className="m-0 grid list-none grid-cols-2 gap-x-3.5 gap-y-6 p-0 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-9">
                {row.entries.map((e) => (
                  <li key={e.key} className="min-w-0">
                    {e.kind === 'album' ? (
                      <AlbumCard
                        album={e.album}
                        href={`/${locale}/gallery/${e.album.slug}`}
                        number={labels.counts[e.album.slug]?.number ?? ''}
                        count={labels.counts[e.album.slug]?.count ?? ''}
                        topic={labels.topics[e.topic]}
                        sizes="(min-width: 1024px) 320px, 50vw"
                      />
                    ) : (
                      <VideoTile video={e.video} labels={labels.player} frame="mt-2.5 aspect-[4/3] rounded-photo" fourThree small sizes="(min-width: 1024px) 320px, 50vw" className="gap-3.5 text-ink">
                        <span className="flex flex-col gap-1">
                          <span className="text-17 font-bold leading-snug text-ink group-hover:text-rust sm:text-19">{e.video.title}</span>
                          <span className="flex flex-wrap gap-x-3 gap-y-1 text-13 text-ink-muted sm:text-14">
                            <span>{labels.video}</span>
                            <span>{e.video.dayText}</span>
                          </span>
                        </span>
                      </VideoTile>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="m-0 text-17 text-ink-body">{labels.empty}</p>
            <button type="button" onClick={() => setTopic(null)} className={cn(chip, chipOff)}>
              {labels.showAll}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
