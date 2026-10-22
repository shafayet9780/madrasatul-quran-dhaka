import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n';
import type { Video } from '@/lib/gallery/albums';
import { Icon } from '@/components/site/icon';
import { VideoTile, type VideoLabels } from './video-tile';

/**
 * Watch, on dark: the newest wide video large with the next three beside it, then the short upright videos in a row
 * (a strip that scrolls sideways on a phone). Only the covers load; a video plays in a window when it is tapped.
 */
export async function GalleryWatch({ locale, wide, upright, youtube, player }: { locale: Locale; wide: Video[]; upright: Video[]; youtube?: string; player: VideoLabels }) {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  if (!wide.length && !upright.length) return null;
  const [main, ...more] = wide;
  return (
    <section aria-labelledby="gallery-watch" className="bg-dark text-on-dark-body">
      <div className="page-wrap flex flex-col gap-11 py-section">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex max-w-[720px] flex-col gap-3">
            <h2 id="gallery-watch" className="m-0 text-h2 text-on-dark">
              {t('watch.title')}
            </h2>
            <p className="m-0 text-lead text-on-dark-body">{t('watch.lead')}</p>
          </div>
          {youtube && (
            <a href={youtube} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-16 font-strong text-bronze-light no-underline hover:text-on-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light">
              <Icon name="youtube-logo" />
              {t('hero.youtube')}
            </a>
          )}
        </div>

        {main && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
            <VideoTile video={main} labels={player} frame="aspect-video rounded-photo shadow-frame-dark" sizes="(min-width: 1024px) 800px, 100vw" className="gap-3.5">
              <span className="flex flex-col gap-1">
                <span className="text-h4 text-on-dark">{main.title}</span>
                {main.dayText && <span className="text-14 text-on-dark-muted">{main.dayText}</span>}
              </span>
            </VideoTile>
            {more.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-[18px] p-0">
                {more.slice(0, 3).map((v) => (
                  <li key={`${v.album}-${v.key}`}>
                    <VideoTile video={v} labels={player} frame="aspect-[16/10] rounded-cell" playButton={false} sizes="150px" className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                      <span className="flex flex-col gap-1">
                        <span className="text-16 font-strong text-on-dark">{v.title}</span>
                        {v.dayText && <span className="text-14 text-on-dark-muted">{v.dayText}</span>}
                      </span>
                    </VideoTile>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {upright.length > 0 && (
          <div className="flex flex-col gap-[18px]">
            <h3 className="m-0 text-h4 text-on-dark">{t('watch.shorts')}</h3>
            <ul className="m-0 flex list-none gap-3.5 overflow-x-auto p-0 [scrollbar-width:none] lg:grid lg:grid-cols-6 lg:overflow-visible">
              {upright.slice(0, 6).map((v) => (
                <li key={`${v.album}-${v.key}`} className="min-w-[140px] lg:min-w-0">
                  <VideoTile video={v} labels={player} frame="aspect-[9/16] rounded-[12px]" small sizes="(min-width: 1024px) 200px, 140px" className="gap-2">
                    <span className="text-15 text-on-dark-body">{v.title}</span>
                  </VideoTile>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
