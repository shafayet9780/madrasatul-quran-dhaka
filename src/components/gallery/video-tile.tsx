'use client';

import Image from 'next/image';
import { useRef, useState, type ReactNode } from 'react';
import { youtubeCover, type Video } from '@/lib/gallery/albums';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type VideoLabels = { play: string; close: string; onYoutube: string };

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * A video's cover with a play button. Nothing from YouTube but the cover loads until it is played: then a window opens
 * with the player (youtube-nocookie). Without JavaScript the link opens the video on YouTube. `frame` sizes the cover;
 * `fourThree` scales a wide cover up so its bars fall outside a 4:3 frame; `playButton` false leaves only the length
 * (small covers in a list). The text below comes in as children.
 */
export function VideoTile({
  video,
  labels,
  frame,
  fourThree = false,
  small = false,
  playButton = true,
  sizes,
  className,
  children,
}: {
  video: Video;
  labels: VideoLabels;
  frame: string;
  fourThree?: boolean;
  small?: boolean;
  playButton?: boolean;
  sizes: string;
  className?: string;
  children?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const watch = `https://www.youtube.com/watch?v=${video.id}`;
  const close = () => dialog.current?.close();

  return (
    <>
      <a
        href={watch}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || !dialog.current?.showModal) return;
          e.preventDefault();
          setOpen(true);
          dialog.current.showModal();
        }}
        aria-label={labels.play.replace('{title}', video.title)}
        className={cn('group flex flex-col gap-2.5 text-inherit no-underline', focusRing, 'focus-visible:outline-current', className)}
      >
        <span className={cn('relative block overflow-hidden bg-panel', frame)}>
          <Image
            src={youtubeCover(video.id)}
            alt=""
            fill
            sizes={sizes}
            // A cover YouTube cannot serve stays the frame's plain colour.
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
            className={cn('object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]', fourThree && 'scale-[1.34] group-hover:scale-[1.38]')}
          />
          {playButton && (
            <span
              className={cn(
                'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-dark/80 text-cream shadow-[0_0_0_1.5px_rgb(244_236_221/0.5)]',
                small ? 'size-12' : 'size-14 sm:size-[68px]',
              )}
            >
              <Icon name="play" size={small ? 20 : 26} className="ml-1" />
            </span>
          )}
          {video.length && <span className="absolute bottom-2.5 right-2.5 flex h-6 items-center rounded-[6px] bg-dark/80 px-2 text-13 font-strong text-cream">{video.length}</span>}
        </span>
        {children}
      </a>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && close()}
        aria-label={video.title}
        className="m-auto w-[min(100vw-32px,1100px)] max-w-none overflow-visible bg-transparent p-0 outline-none backdrop:bg-dark/90"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 text-on-dark">
            <p className="m-0 min-w-0 truncate text-17 font-bold">{video.title}</p>
            <div className="flex shrink-0 items-center gap-2">
              <a href={watch} target="_blank" rel="noopener noreferrer" className={cn('hidden min-h-11 items-center gap-1.5 px-2 text-15 font-strong text-bronze-light no-underline sm:inline-flex', focusRing, 'focus-visible:outline-bronze-light')}>
                {labels.onYoutube}
                <Icon name="arrow-up-right" size={16} />
              </a>
              <button type="button" onClick={close} aria-label={labels.close} className={cn('inline-flex size-11 items-center justify-center rounded-full bg-panel text-on-dark hover:bg-line-dark', focusRing, 'focus-visible:outline-bronze-light')}>
                <Icon name="x" />
              </button>
            </div>
          </div>
          <div className={cn('mx-auto w-full overflow-hidden rounded-photo bg-black', video.upright ? 'aspect-[9/16] max-h-[calc(100dvh-120px)] max-w-[calc((100dvh-120px)*9/16)]' : 'aspect-video')}>
            {open && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`}
                title={video.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full border-0"
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
