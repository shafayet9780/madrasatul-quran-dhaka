'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Photo, Video } from '@/lib/gallery/albums';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';
import { VideoTile, type VideoLabels } from './video-tile';
import { copyLink } from '@/components/site/share-links';

export type ViewerLabels = {
  label: string;
  counter: string;
  prev: string;
  next: string;
  close: string;
  send: string;
  copy: string;
  copied: string;
  swipe: string;
  thumbs: string;
  open: string;
};

const focusDark = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze-light';
const round = cn('inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-panel text-on-dark hover:bg-line-dark', focusDark);
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const HASH = /^#photo-(\d+)$/;

/**
 * The album's photos in justified rows (each keeps its shape; a row shares one height), with the videos after the third
 * photo. A photo opens the viewer: the photo large, its caption and the day, the count, previous and next (arrow keys,
 * or a swipe on a phone), a strip of all the photos, and sending the photo on WhatsApp or copying its link. A link
 * ending in #photo-3 opens the third photo.
 */
export function AlbumPhotos({
  photos,
  videos,
  title,
  dateText,
  url,
  numbers,
  labels,
  player,
}: {
  photos: Photo[];
  videos: Video[];
  title: string;
  dateText: string;
  /** The album's address, for the links the viewer sends. */
  url: string;
  /** 1, 2, 3… in the page's numerals. */
  numbers: string[];
  labels: ViewerLabels;
  player: VideoLabels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const swipe = useRef<number | null>(null);

  const show = (i: number) => {
    setAt(i);
    setCopied(false);
    history.replaceState(null, '', `#photo-${i + 1}`);
    if (!dialog.current?.open) dialog.current?.showModal();
  };
  const step = (d: number) => at !== null && show((at + d + photos.length) % photos.length);

  // A shared link opens its photo once the page has drawn, and so does a #photo-N link followed on the page.
  useEffect(() => {
    const open = () => {
      const n = Number(HASH.exec(location.hash)?.[1]);
      if (n >= 1 && n <= photos.length && !dialog.current?.open) show(n - 1);
    };
    const frame = requestAnimationFrame(open);
    window.addEventListener('hashchange', open);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', open);
    };
  }, [photos.length]);

  useEffect(() => {
    if (at === null) return;
    strip.current?.querySelector<HTMLElement>(`[data-at="${at}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [at]);

  const shots = photos.map((p, i) => ({ photo: p, i }));
  // The videos come after the third photo.
  const order = [...shots.slice(0, 3), ...videos.map((v) => ({ video: v })), ...shots.slice(3)];
  const cur = at === null ? null : photos[at];
  const link = at === null ? url : `${url}#photo-${at + 1}`;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 after:grow-[999999] after:content-[''] sm:gap-2.5">
        {order.map((item) =>
          'photo' in item ? (
            <button
              key={`p-${item.photo.key}`}
              type="button"
              onClick={() => show(item.i)}
              aria-label={fill(labels.open, { alt: item.photo.alt })}
              style={{ '--r': item.photo.ratio } as CSSProperties}
              className="group relative aspect-[var(--r)] grow-[var(--r)] basis-[calc(var(--r)*150px)] overflow-hidden rounded-[10px] bg-sand-pale p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:basis-[calc(var(--r)*290px)] sm:rounded-[12px]"
            >
              <Image src={item.photo.src} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]" style={{ objectPosition: item.photo.position }} />
              <span aria-hidden="true" className="absolute right-2.5 top-2.5 hidden size-10 items-center justify-center rounded-full bg-surface/95 text-ink group-hover:flex group-focus-visible:flex">
                <Icon name="arrows-out-simple" size={16} />
              </span>
              {item.photo.caption && (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden bg-[linear-gradient(180deg,rgb(44_31_21/0),rgb(44_31_21/0.85))] px-3.5 pb-3 pt-9 text-left text-14 font-strong text-cream sm:block">
                  {item.photo.caption}
                </span>
              )}
            </button>
          ) : (
            <div
              key={`v-${item.video.key}`}
              style={{ '--r': item.video.upright ? 9 / 16 : 16 / 9 } as CSSProperties}
              className="grow-[var(--r)] basis-[calc(var(--r)*150px)] sm:basis-[calc(var(--r)*290px)]"
            >
              <VideoTile video={item.video} labels={player} frame="aspect-[var(--r)] rounded-[10px] sm:rounded-[12px]" sizes="(min-width: 640px) 50vw, 100vw" />
            </div>
          ),
        )}
      </div>

      <dialog
        ref={dialog}
        aria-label={labels.label}
        onClose={() => {
          setAt(null);
          history.replaceState(null, '', location.pathname + location.search);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-dark p-0 outline-none text-on-dark-body backdrop:bg-dark"
      >
        {cur && at !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-line-dark px-3 py-2.5 sm:px-6 sm:py-3.5">
              <p className="m-0 flex min-w-0 items-baseline gap-3.5">
                <b className="truncate text-15 font-bold text-cream sm:text-17">{title}</b>
                <span className="shrink-0 text-14 text-on-dark-muted">{fill(labels.counter, { at: numbers[at], total: numbers[photos.length - 1] })}</span>
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={labels.send}
                  className={cn('inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-whatsapp-brand text-15 font-strong text-ink no-underline hover:bg-whatsapp-brand-deep sm:w-auto sm:px-4', 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream')}
                >
                  <Icon name="whatsapp-logo" />
                  <span className="hidden sm:inline">{labels.send}</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyLink(link, labels.copy, () => setCopied(true))}
                  aria-label={copied ? labels.copied : labels.copy}
                  className={cn('inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full bg-panel text-15 font-strong text-on-dark hover:bg-line-dark sm:w-auto sm:px-4', focusDark)}
                >
                  <Icon name="link-simple" />
                  <span className="hidden sm:inline" aria-live="polite">
                    {copied ? labels.copied : labels.copy}
                  </span>
                </button>
                <button type="button" onClick={() => dialog.current?.close()} aria-label={labels.close} className={round}>
                  <Icon name="x" />
                </button>
              </div>
            </div>

            <div
              className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] items-center sm:grid-cols-[88px_minmax(0,1fr)_88px]"
              onPointerDown={(e) => (swipe.current = e.clientX)}
              onPointerUp={(e) => {
                if (swipe.current === null) return;
                const dx = e.clientX - swipe.current;
                swipe.current = null;
                if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
              }}
            >
              <div className="absolute left-2 top-1/2 z-[2] -translate-y-1/2 sm:static sm:flex sm:translate-y-0 sm:justify-center">
                <button type="button" onClick={() => step(-1)} aria-label={labels.prev} className={cn(round, 'bg-panel/90 shadow-[inset_0_0_0_1.5px_var(--color-line-dark-strong)] sm:size-14')}>
                  <Icon name="caret-left" size={24} />
                </button>
              </div>
              <figure className="relative m-0 h-full min-h-0 py-3 sm:py-6">
                <Image key={cur.key} src={cur.src} alt={cur.alt} fill sizes="100vw" className="object-contain sm:rounded-[10px]" priority />
              </figure>
              <div className="absolute right-2 top-1/2 z-[2] -translate-y-1/2 sm:static sm:flex sm:translate-y-0 sm:justify-center">
                <button type="button" onClick={() => step(1)} aria-label={labels.next} className={cn(round, 'bg-panel/90 shadow-[inset_0_0_0_1.5px_var(--color-line-dark-strong)] sm:size-14')}>
                  <Icon name="caret-right" size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 px-3.5 pb-4 pt-2.5 sm:px-6 sm:pb-[18px] sm:pt-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <p className="m-0 text-16 leading-normal text-cream">{cur.caption || cur.alt}</p>
                {dateText && <span className="shrink-0 text-14 text-on-dark-muted">{dateText}</span>}
              </div>
              <div ref={strip} role="group" aria-label={labels.thumbs} className="flex gap-2 overflow-x-auto [scrollbar-width:none] sm:justify-center">
                {photos.map((p, i) => (
                  <button
                    key={p.key}
                    type="button"
                    data-at={i}
                    onClick={() => show(i)}
                    aria-label={fill(labels.open, { alt: p.alt })}
                    aria-current={i === at ? 'true' : undefined}
                    className={cn('relative h-11 w-14 shrink-0 overflow-hidden rounded-[8px] bg-panel p-0 opacity-55 hover:opacity-90 sm:h-[60px] sm:w-[84px]', focusDark, i === at && 'opacity-100 shadow-[0_0_0_2px_var(--color-dark),0_0_0_4px_var(--color-bronze-light)]')}
                  >
                    <Image src={p.src} alt="" fill sizes="84px" className="object-cover" style={{ objectPosition: p.position }} />
                  </button>
                ))}
              </div>
              <p className="m-0 text-center text-13 text-on-dark-faint sm:hidden">{labels.swipe}</p>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
