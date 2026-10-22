'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/site/icon';
import { cn } from '@/lib/utils';

export type HeroPhoto = { src: string; alt: string; position: string };

const SPAN = ['row-span-2', '', ''];
const SIZES = ['(min-width: 1024px) 34vw, 56vw', '(min-width: 1024px) 26vw, 44vw', '(min-width: 1024px) 26vw, 44vw'];
const EVERY_MS = 3500;

/**
 * The hero photos: up to three tiles that take turns. Every 3.5 seconds one tile cross-fades to the next photo, the small
 * tiles first, so the first photo (the big tile) stays longest.
 * It pauses off-screen, on hover or focus, and with its pause button, and never moves under reduced motion.
 * The first photos load with the page; a later one loads when its turn comes and fades in once it has arrived.
 */
export function HeroGallery({ photos, label, pauseLabel }: { photos: HeroPhoto[]; label: string; pauseLabel: string }) {
  const tiles = Math.min(3, photos.length);
  // Each tile shows the last photo of its stack; while a new one fades in, the old one stays below it.
  const [stacks, setStacks] = useState<number[][]>(() => Array.from({ length: tiles }, (_, i) => [i]));
  const [reduced, setReduced] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // The photos not on screen wait in a queue; a tile takes the first one and its old photo joins the back.
  const turn = useRef({
    tile: tiles > 1 ? 1 : 0,
    shown: Array.from({ length: tiles }, (_, i) => i),
    queue: Array.from({ length: Math.max(0, photos.length - tiles) }, (_, i) => tiles + i),
  });
  const rotates = photos.length > tiles && !reduced;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => {
      media.removeEventListener('change', update);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!rotates || paused || hovered || offscreen) return;
    const id = window.setInterval(() => {
      const { tile, shown, queue } = turn.current;
      const incoming = queue.shift()!;
      queue.push(shown[tile]);
      shown[tile] = incoming;
      turn.current.tile = (tile + 1) % tiles;
      setStacks((all) => all.map((stack, i) => (i === tile ? [stack[stack.length - 1], incoming] : stack)));
    }, EVERY_MS);
    return () => window.clearInterval(id);
  }, [rotates, paused, hovered, offscreen, tiles]);

  const settle = (tile: number) => setStacks((all) => all.map((s, i) => (i === tile ? [s[s.length - 1]] : s)));

  if (tiles === 0) return null;
  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className={cn('grid h-[clamp(300px,38vw,540px)] gap-3', tiles > 1 && 'grid-cols-[1.3fr_1fr]', tiles === 3 && 'grid-rows-2')}>
        {stacks.map((stack, tile) => (
          <div key={tile} className={cn('relative overflow-hidden rounded-card bg-sand-pale', tiles === 3 && SPAN[tile], tile > 0 && 'motion-safe:animate-settle')}>
            {stack.map((p, layer) => {
              const incoming = layer > 0;
              return (
                <Image
                  key={p}
                  src={photos[p].src}
                  alt={layer === stack.length - 1 ? photos[p].alt : ''}
                  fill
                  sizes={SIZES[tile]}
                  preload={tile === 0 && !incoming}
                  fetchPriority={tile === 0 && !incoming ? 'high' : undefined}
                  loading={incoming ? undefined : 'eager'}
                  className={cn('object-cover', incoming && 'opacity-0 data-[loaded]:animate-tile-in')}
                  style={{ objectPosition: photos[p].position }}
                  onLoad={incoming ? (e) => e.currentTarget.setAttribute('data-loaded', '') : undefined}
                  onAnimationEnd={incoming ? () => settle(tile) : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      {photos.length > tiles && !reduced && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={pauseLabel}
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-dark/70 text-on-dark hover:bg-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Icon name={paused ? 'play' : 'pause'} size={18} />
        </button>
      )}
    </div>
  );
}
