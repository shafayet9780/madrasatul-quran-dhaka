'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/** What the stage shows at one moment of the day. */
export type StageBeat = { sky: string; groups: string; sun: number; lift: number | null };

const WIDE = '(min-width: 1024px)';
const STILL = '(prefers-reduced-motion: reduce)';

/**
 * Plays the day as the reader scrolls. The current stop is the last step whose top has passed the reading line (60%
 * of the screen; 78% on phones, under the stage), as its words come up, and its progress past the line picks the
 * moment within it. On a change of moment it sets the stage's sky, chips, sun and lift, and data-pos (next | now |
 * past) on everything that lists its moments in data-beats; CSS transitions do the rest. Nothing re-renders: the stage is server HTML.
 * Layers beside the current stop get data-near, so a stop's photos load as the day comes to it.
 */
export function TourDriver({ beats, counts, className, style, children }: { beats: StageBeat[]; counts: number[]; className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const stage = root?.querySelector<HTMLElement>('[data-stage]');
    if (!root || !stage || matchMedia(STILL).matches) return;
    const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
    const driven = [...root.querySelectorAll<HTMLElement>('[data-beats]')].map((el) => {
      const list = el.dataset.beats!.split(' ').map(Number);
      return { el, list, max: Math.max(...list), layer: el.dataset.layer === undefined ? null : Number(el.dataset.layer) };
    });
    const first = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0));
    const wide = matchMedia(WIDE);
    let current = -1;
    let frame = 0;

    const show = (g: number, stop: number) => {
      const b = beats[g];
      stage.dataset.sky = b.sky;
      stage.dataset.groups = b.groups;
      stage.dataset.lift = b.lift === null ? 'off' : 'on';
      stage.style.setProperty('--sun', String(b.sun));
      if (b.lift !== null) stage.style.setProperty('--lift', String(b.lift));
      for (const d of driven) {
        d.el.dataset.pos = d.list.includes(g) ? 'now' : g > d.max ? 'past' : 'next';
        if (d.layer !== null) d.el.toggleAttribute('data-near', Math.abs(d.layer - stop) <= 1);
      }
    };

    const update = () => {
      frame = 0;
      const line = innerHeight * (wide.matches ? 0.6 : 0.78);
      let i = 0;
      let p = 0;
      for (let k = 0; k < steps.length; k++) {
        const r = steps[k].getBoundingClientRect();
        if (r.top > line) break;
        i = k;
        p = (line - r.top) / r.height;
      }
      const n = counts[i] ?? 1;
      const g = first[i] + Math.min(n - 1, Math.floor(Math.min(Math.max(p, 0), 0.999) * n));
      if (g !== current) {
        current = g;
        show(g, i);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Listen only while the tour is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', onScroll);
        onScroll();
      } else {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
      }
    });
    io.observe(root);
    return () => {
      io.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [beats, counts]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
