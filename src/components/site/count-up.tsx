'use client';

import { useEffect, useRef } from 'react';
import { toBengaliDigits } from '@/lib/survey/normalise';

const DURATION_MS = 1200;

/**
 * A number that counts up once, when it scrolls into view. The final value is in the HTML from the start
 * (search engines, screen readers, no JavaScript); it only counts when it starts below the screen and motion is allowed.
 */
export function CountUp({ to, bengali, suffix = '', children }: { to: number; bengali: boolean; suffix?: string; children: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const text = el?.firstChild;
    if (!el || !(text instanceof Text) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
    // Writes into React's own text node, so React still owns it afterwards.
    const print = (n: number) => (text.data = `${bengali ? toBengaliDigits(n) : n}${suffix}`);
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / DURATION_MS);
        print(Math.round(to * (1 - Math.pow(1 - p, 4))));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    print(0);
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      text.data = children;
    };
  }, [to, bengali, suffix, children]);

  return <span ref={ref}>{children}</span>;
}
